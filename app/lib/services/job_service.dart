import '../models/job.dart';
import '../models/json.dart';
import 'api_client.dart';

/// Filters for `GET /api/jobs`.
class JobQuery {
  final String search;
  final String? type;
  final String? workMode;
  final String? level;
  final String sort; // recent | match | deadline

  const JobQuery({
    this.search = '',
    this.type,
    this.workMode,
    this.level,
    this.sort = 'recent',
  });

  JobQuery copyWith({
    String? search,
    Object? type = _keep,
    Object? workMode = _keep,
    Object? level = _keep,
    String? sort,
  }) {
    return JobQuery(
      search: search ?? this.search,
      type: identical(type, _keep) ? this.type : type as String?,
      workMode: identical(workMode, _keep) ? this.workMode : workMode as String?,
      level: identical(level, _keep) ? this.level : level as String?,
      sort: sort ?? this.sort,
    );
  }

  static const Object _keep = Object();

  bool get hasFilters => type != null || workMode != null || level != null;
}

class JobMeta {
  final List<String> types;
  final List<String> workModes;
  final List<String> levels;
  final List<String> skills; // most used first

  const JobMeta({
    this.types = const [],
    this.workModes = const [],
    this.levels = const [],
    this.skills = const [],
  });
}

class JobService {
  JobService._();
  static final instance = JobService._();
  final _client = ApiClient.instance;

  Future<List<Job>> fetchJobs(JobQuery q) async {
    final data = await _client.get('/api/jobs', query: {
      'search': q.search,
      'type': q.type,
      'workMode': q.workMode,
      'level': q.level,
      'sort': q.sort,
    });
    return mapList(data['jobs']).map((j) => Job.fromJson(j)).toList();
  }

  Future<Job> fetchJob(String id) async {
    final data = await _client.get('/api/jobs/$id');
    return Job.fromJson(asMap(data['job']));
  }

  Future<List<Job>> fetchSaved() async {
    final data = await _client.get('/api/jobs/saved');
    return mapList(data['jobs']).map((j) => Job.fromJson(j, isSaved: true)).toList();
  }

  /// Returns the new saved state.
  Future<bool> toggleSave(String jobId) async {
    final data = await _client.post('/api/jobs/$jobId/save');
    return boolOr(data['isSaved']);
  }

  Future<JobMeta> fetchMeta() async {
    final data = await _client.get('/api/jobs/meta', authed: false);
    return JobMeta(
      types: strList(data['types']),
      workModes: strList(data['workModes']),
      levels: strList(data['levels']),
      skills: mapList(data['skills']).map((s) => str(s['name'])).toList(),
    );
  }
}
