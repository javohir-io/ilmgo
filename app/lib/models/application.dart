import 'job.dart';
import 'json.dart';

class ApplicationEvent {
  final String status;
  final String note;
  final DateTime? createdAt;

  const ApplicationEvent({
    required this.status,
    this.note = '',
    this.createdAt,
  });

  factory ApplicationEvent.fromJson(Map<String, dynamic> j) => ApplicationEvent(
        status: str(j['status']),
        note: str(j['note']),
        createdAt: dateOrNull(j['createdAt']),
      );
}

/// `Application` in docs/API.md. Status: submitted | reviewing | interview |
/// offer | rejected | withdrawn.
class Application {
  final String id;
  final String jobId;
  final String firstName;
  final String lastName;
  final String phone;
  final String email;
  final String skillLevel;
  final String coverNote;
  final String resumeOriginalName;
  final String resumeUrl;
  final String status;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final JobRef job;
  final List<ApplicationEvent> events;

  const Application({
    required this.id,
    required this.jobId,
    required this.firstName,
    required this.lastName,
    required this.phone,
    required this.email,
    required this.skillLevel,
    required this.status,
    required this.job,
    this.coverNote = '',
    this.resumeOriginalName = '',
    this.resumeUrl = '',
    this.createdAt,
    this.updatedAt,
    this.events = const [],
  });

  factory Application.fromJson(Map<String, dynamic> j) {
    return Application(
      id: str(j['id']),
      jobId: str(j['jobId']),
      firstName: str(j['firstName']),
      lastName: str(j['lastName']),
      phone: str(j['phone']),
      email: str(j['email']),
      skillLevel: str(j['skillLevel']),
      coverNote: str(j['coverNote']),
      resumeOriginalName: str(j['resumeOriginalName']),
      resumeUrl: str(j['resumeUrl']),
      status: str(j['status'], 'submitted'),
      createdAt: dateOrNull(j['createdAt']),
      updatedAt: dateOrNull(j['updatedAt']),
      job: JobRef.fromJson(j['job']),
      events: mapList(j['events']).map(ApplicationEvent.fromJson).toList(),
    );
  }

  /// Still moving through the pipeline.
  bool get isActive =>
      status == 'submitted' || status == 'reviewing' || status == 'interview';

  bool get isClosed => status == 'rejected' || status == 'withdrawn';

  /// Position on the Applied -> Reviewing -> Interview -> Offer track.
  static int stageOfStatus(String status) {
    switch (status) {
      case 'reviewing':
        return 1;
      case 'interview':
        return 2;
      case 'offer':
        return 3;
      default:
        return 0;
    }
  }

  /// Current stage. Rejected / withdrawn applications stop at the furthest
  /// stage they actually reached (taken from the event history).
  int get stage {
    if (!isClosed) return stageOfStatus(status);
    var best = 0;
    for (final e in events) {
      final s = stageOfStatus(e.status);
      if (s > best) best = s;
    }
    return best;
  }

  /// Can the student book an interview for this application?
  bool get canSchedule => isActive;
}
