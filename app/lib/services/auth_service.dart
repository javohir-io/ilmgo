import '../models/json.dart';
import '../models/user.dart';
import 'api_client.dart';

class AuthService {
  AuthService._();
  static final instance = AuthService._();
  final _client = ApiClient.instance;

  Future<AppUser> register({
    required String name,
    required String email,
    required String password,
    String? university,
    String? degreeProgram,
  }) async {
    final data = await _client.post('/api/auth/register', authed: false, body: {
      'name': name,
      'email': email,
      'password': password,
      if (university != null && university.isNotEmpty) 'university': university,
      if (degreeProgram != null && degreeProgram.isNotEmpty)
        'degreeProgram': degreeProgram,
    });
    await _client.saveToken(str(data['token']));
    return AppUser.fromJson(asMap(data['user']));
  }

  Future<AppUser> login({
    required String email,
    required String password,
  }) async {
    final data = await _client.post('/api/auth/login',
        authed: false, body: {'email': email, 'password': password});
    await _client.saveToken(str(data['token']));
    return AppUser.fromJson(asMap(data['user']));
  }

  Future<AppUser> fetchMe() async {
    final data = await _client.get('/api/auth/me');
    return AppUser.fromJson(asMap(data['user']));
  }

  /// Only the keys present in [fields] are sent (see PUT /api/auth/me).
  Future<AppUser> updateProfile(Map<String, dynamic> fields) async {
    final data = await _client.put('/api/auth/me', body: fields);
    return AppUser.fromJson(asMap(data['user']));
  }

  Future<AppUser> uploadProfilePhoto({
    required List<int> bytes,
    required String fileName,
  }) async {
    final data = await _client.postMultipart(
      '/api/auth/me/photo',
      fields: const {},
      fileFieldName: 'photo',
      bytes: bytes,
      fileName: fileName,
    );
    return AppUser.fromJson(asMap(data['user']));
  }

  Future<void> logout() => _client.clearToken();

  Future<bool> get hasToken async => (await _client.token) != null;
}
