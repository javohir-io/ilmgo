import '../models/application.dart';
import '../models/json.dart';
import 'api_client.dart';

class ApplicationService {
  ApplicationService._();
  static final instance = ApplicationService._();
  final _client = ApiClient.instance;

  Future<Application> submit({
    required String jobId,
    required String firstName,
    required String lastName,
    required String address,
    required String city,
    required String university,
    required String phone,
    required String email,
    required String skillLevel,
    required String coverNote,
    required List<int> resumeBytes,
    required String resumeFileName,
  }) async {
    final data = await _client.postMultipart(
      '/api/applications',
      fields: {
        'jobId': jobId,
        'firstName': firstName,
        'lastName': lastName,
        'address': address,
        'city': city,
        'university': university,
        'phone': phone,
        'email': email,
        'skillLevel': skillLevel,
        if (coverNote.isNotEmpty) 'coverNote': coverNote,
      },
      fileFieldName: 'resume',
      bytes: resumeBytes,
      fileName: resumeFileName,
    );
    return Application.fromJson(asMap(data['application']));
  }

  Future<List<Application>> list() async {
    final data = await _client.get('/api/applications');
    return mapList(data['applications']).map(Application.fromJson).toList();
  }

  Future<Application> detail(String id) async {
    final data = await _client.get('/api/applications/$id');
    return Application.fromJson(asMap(data['application']));
  }

  Future<Application> withdraw(String id) async {
    final data = await _client.post('/api/applications/$id/withdraw');
    return Application.fromJson(asMap(data['application']));
  }
}
