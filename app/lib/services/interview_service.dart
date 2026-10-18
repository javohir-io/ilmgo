import '../models/interview.dart';
import '../models/json.dart';
import 'api_client.dart';

class InterviewService {
  InterviewService._();
  static final instance = InterviewService._();
  final _client = ApiClient.instance;

  /// Open/taken 30-minute slots for [date] ("YYYY-MM-DD"). Empty on
  /// weekends and past days.
  Future<List<SlotInfo>> slots({
    required String jobId,
    required String date,
  }) async {
    final data = await _client
        .get('/api/interviews/slots', query: {'jobId': jobId, 'date': date});
    return mapList(data['slots']).map(SlotInfo.fromJson).toList();
  }

  Future<Interview> book({
    required String jobId,
    String? applicationId,
    required String date,
    required String time,
    String? reason,
  }) async {
    final data = await _client.post('/api/interviews', body: {
      'jobId': jobId,
      if (applicationId != null) 'applicationId': applicationId,
      'date': date,
      'time': time,
      if (reason != null && reason.trim().isNotEmpty) 'reason': reason.trim(),
    });
    return Interview.fromJson(asMap(data['interview']));
  }

  Future<List<Interview>> list() async {
    final data = await _client.get('/api/interviews');
    return mapList(data['interviews']).map(Interview.fromJson).toList();
  }

  Future<Interview> cancel(String id) async {
    final data = await _client.post('/api/interviews/$id/cancel');
    return Interview.fromJson(asMap(data['interview']));
  }
}
