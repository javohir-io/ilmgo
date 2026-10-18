import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// Thrown for any failed API call. [message] is safe to show to the user.
class ApiException implements Exception {
  final int statusCode;
  final String message;
  const ApiException(this.statusCode, this.message);

  bool get isNetwork => statusCode == 0;
  bool get isConflict => statusCode == 409;

  @override
  String toString() => message;
}

/// Thin wrapper around `package:http`:
///  * prefixes the configured base URL,
///  * attaches the stored JWT as a Bearer token,
///  * applies a 15s timeout and turns network failures into friendly errors,
///  * calls [onUnauthorized] when an authenticated request gets a 401.
///
/// Configure the server at run time:
///   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000
class ApiClient {
  ApiClient._();
  static final ApiClient instance = ApiClient._();

  static const String _baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000',
  );
  static const Duration _timeout = Duration(seconds: 15);
  static const String _tokenKey = 'auth_token';

  static String get baseUrl => _baseUrl;

  /// "/uploads/x.png" -> "http://host:3000/uploads/x.png". Null/empty -> null.
  static String? absoluteUrl(String? path) {
    if (path == null || path.isEmpty) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return '$_baseUrl${path.startsWith('/') ? '' : '/'}$path';
  }

  /// Set by AppState: invoked when a signed-in request is rejected with 401.
  void Function()? onUnauthorized;

  String? _cachedToken;

  Future<String?> get token async {
    if (_cachedToken != null) return _cachedToken;
    try {
      final prefs = await SharedPreferences.getInstance();
      _cachedToken = prefs.getString(_tokenKey);
    } catch (_) {}
    return _cachedToken;
  }

  Future<void> saveToken(String token) async {
    _cachedToken = token;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_tokenKey, token);
    } catch (_) {}
  }

  Future<void> clearToken() async {
    _cachedToken = null;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_tokenKey);
    } catch (_) {}
  }

  Uri _uri(String path, [Map<String, dynamic>? query]) {
    final clean = path.startsWith('/') ? path : '/$path';
    final params = <String, String>{};
    query?.forEach((k, v) {
      if (v != null && v.toString().isNotEmpty) params[k] = v.toString();
    });
    return Uri.parse('$_baseUrl$clean')
        .replace(queryParameters: params.isEmpty ? null : params);
  }

  Future<Map<String, String>> _headers({bool json = true}) async {
    final t = await token;
    return {
      'Accept': 'application/json',
      if (json) 'Content-Type': 'application/json',
      if (t != null) 'Authorization': 'Bearer $t',
    };
  }

  Future<dynamic> _send(Future<http.Response> Function() call,
      {bool authed = true}) async {
    http.Response response;
    try {
      response = await call().timeout(_timeout);
    } on TimeoutException {
      throw const ApiException(
          0, 'Server juda sekin javob berdi. Qayta urinib koʻring.');
    } on http.ClientException {
      throw const ApiException(0,
          'Ilmgo serveriga ulanib boʻlmadi. Internet aloqasi va API_BASE_URL ni tekshiring.');
    }
    return _decode(response, authed: authed);
  }

  dynamic _decode(http.Response response, {required bool authed}) {
    dynamic decoded = <String, dynamic>{};
    if (response.body.isNotEmpty) {
      try {
        decoded = jsonDecode(utf8.decode(response.bodyBytes));
      } catch (_) {
        decoded = <String, dynamic>{};
      }
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      if (response.statusCode == 401 && authed && _cachedToken != null) {
        onUnauthorized?.call();
      }
      final message = (decoded is Map && decoded['error'] != null)
          ? decoded['error'].toString()
          : 'Soʻrov bajarilmadi (${response.statusCode})';
      throw ApiException(response.statusCode, message);
    }
    return decoded;
  }

  Future<dynamic> get(String path,
      {Map<String, dynamic>? query, bool authed = true}) async {
    final headers = await _headers(json: false);
    return _send(() => http.get(_uri(path, query), headers: headers),
        authed: authed);
  }

  Future<dynamic> post(String path,
      {Object? body, bool authed = true}) async {
    final headers = await _headers();
    return _send(
      () => http.post(_uri(path),
          headers: headers, body: body == null ? null : jsonEncode(body)),
      authed: authed,
    );
  }

  Future<dynamic> put(String path, {Object? body}) async {
    final headers = await _headers();
    return _send(() => http.put(_uri(path),
        headers: headers, body: body == null ? null : jsonEncode(body)));
  }

  /// Multipart POST that takes raw [bytes] so it works on every platform
  /// (web file pickers never expose a disk path).
  Future<dynamic> postMultipart(
    String path, {
    required Map<String, String> fields,
    required String fileFieldName,
    required List<int> bytes,
    required String fileName,
  }) async {
    final t = await token;
    return _send(() async {
      final request = http.MultipartRequest('POST', _uri(path));
      request.headers['Accept'] = 'application/json';
      if (t != null) request.headers['Authorization'] = 'Bearer $t';
      request.fields.addAll(fields);
      request.files.add(
        http.MultipartFile.fromBytes(fileFieldName, bytes, filename: fileName),
      );
      final streamed = await request.send();
      return http.Response.fromStream(streamed);
    });
  }
}
