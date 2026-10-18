import 'application.dart';
import 'interview.dart';
import 'job.dart';
import 'json.dart';

/// `GET /api/me/overview` — everything the Discover header needs.
class Overview {
  final int applied;
  final int saved;
  final int interviews;
  final int offers;
  final int profileCompleteness;
  final Interview? nextInterview;
  final List<Application> recentApplications;
  final List<Job> recommended;
  final int unreadNotifications;

  const Overview({
    this.applied = 0,
    this.saved = 0,
    this.interviews = 0,
    this.offers = 0,
    this.profileCompleteness = 0,
    this.nextInterview,
    this.recentApplications = const [],
    this.recommended = const [],
    this.unreadNotifications = 0,
  });

  factory Overview.fromJson(Map<String, dynamic> j) {
    final stats = asMap(j['stats']);
    final next = j['nextInterview'];
    return Overview(
      applied: intOr(stats['applied']),
      saved: intOr(stats['saved']),
      interviews: intOr(stats['interviews']),
      offers: intOr(stats['offers']),
      profileCompleteness: intOr(j['profileCompleteness']),
      nextInterview: next is Map ? Interview.fromJson(asMap(next)) : null,
      recentApplications:
          mapList(j['recentApplications']).map(Application.fromJson).toList(),
      recommended: mapList(j['recommended']).map((e) => Job.fromJson(e)).toList(),
      unreadNotifications: intOr(j['unreadNotifications']),
    );
  }
}
