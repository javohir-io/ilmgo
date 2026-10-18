import 'job.dart';
import 'json.dart';

/// `Interview` in docs/API.md. [date] is "YYYY-MM-DD", [time] is "HH:mm".
class Interview {
  final String id;
  final String jobId;
  final String? applicationId;
  final String date;
  final String time;
  final int durationMin;
  final String reason;
  final String status; // scheduled | cancelled | completed
  final JobRef job;

  const Interview({
    required this.id,
    required this.jobId,
    required this.date,
    required this.time,
    required this.job,
    this.applicationId,
    this.durationMin = 30,
    this.reason = '',
    this.status = 'scheduled',
  });

  factory Interview.fromJson(Map<String, dynamic> j) {
    return Interview(
      id: str(j['id']),
      jobId: str(j['jobId']),
      applicationId:
          j['applicationId'] == null ? null : str(j['applicationId']),
      date: str(j['date']),
      time: str(j['time']),
      durationMin: intOr(j['durationMin'], 30),
      reason: str(j['reason']),
      status: str(j['status'], 'scheduled'),
      job: JobRef.fromJson(j['job']),
    );
  }

  bool get isScheduled => status == 'scheduled';
}

/// One entry of `GET /api/interviews/slots`.
class SlotInfo {
  final String time;
  final bool available;
  const SlotInfo({required this.time, required this.available});

  factory SlotInfo.fromJson(Map<String, dynamic> j) =>
      SlotInfo(time: str(j['time']), available: boolOr(j['available']));
}
