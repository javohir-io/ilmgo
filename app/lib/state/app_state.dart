import 'dart:async';

import 'package:flutter/material.dart';

import '../models/application.dart';
import '../models/interview.dart';
import '../models/job.dart';
import '../models/notification.dart';
import '../models/overview.dart';
import '../models/user.dart';
import '../services/api_client.dart';
import '../services/application_service.dart';
import '../services/auth_service.dart';
import '../services/interview_service.dart';
import '../services/job_service.dart';
import '../services/notification_service.dart';
import '../services/overview_service.dart';

/// A loadable slice of state: data + loading + error.
class Load<T> {
  final T data;
  final bool loading;
  final String? error;
  final bool loaded;
  const Load(this.data, {this.loading = false, this.error, this.loaded = false});

  Load<T> copy({T? data, bool? loading, String? error, bool clearError = false, bool? loaded}) =>
      Load<T>(
        data ?? this.data,
        loading: loading ?? this.loading,
        error: clearError ? null : (error ?? this.error),
        loaded: loaded ?? this.loaded,
      );
}

/// App-wide state. Screens read it through [AppStateScope.of] and call its
/// methods; every method talks to a service and then notifies listeners.
class AppState extends ChangeNotifier {
  AppState() {
    ApiClient.instance.onUnauthorized = () => logout();
  }

  AppUser? _user;
  bool _bootstrapping = true;
  Timer? _poll;
  bool _disposed = false;

  Load<List<Job>> jobs = const Load<List<Job>>([]);
  JobQuery query = const JobQuery();
  Load<List<Job>> saved = const Load<List<Job>>([]);
  Load<Overview?> overview = const Load<Overview?>(null);
  Load<List<Application>> applications = const Load<List<Application>>([]);
  Load<List<Interview>> interviews = const Load<List<Interview>>([]);
  Load<List<AppNotification>> notifications =
      const Load<List<AppNotification>>([]);
  int unread = 0;
  JobMeta meta = const JobMeta();

  AppUser? get currentUser => _user;
  bool get isLoggedIn => _user != null;
  bool get bootstrapping => _bootstrapping;

  @override
  void notifyListeners() {
    if (!_disposed) super.notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    _poll?.cancel();
    super.dispose();
  }

  // ---------------------------------------------------------------- session

  /// Restores a saved session (if any) and warms the caches.
  Future<void> bootstrap() async {
    _bootstrapping = true;
    notifyListeners();
    try {
      if (await AuthService.instance.hasToken) {
        _user = await AuthService.instance.fetchMe();
      }
    } on ApiException catch (e) {
      // Only drop the session for real auth failures, not when offline.
      if (e.statusCode == 401 || e.statusCode == 404) {
        await AuthService.instance.logout();
        _user = null;
      }
    } catch (_) {}
    _bootstrapping = false;
    notifyListeners();
    if (isLoggedIn) _afterSignIn();
  }

  void _afterSignIn() {
    refreshAll();
    loadMeta();
    _startPolling();
  }

  Future<void> login({required String email, required String password}) async {
    _user = await AuthService.instance.login(email: email, password: password);
    notifyListeners();
    _afterSignIn();
  }

  Future<void> register({
    required String name,
    required String email,
    required String password,
    String? university,
    String? degreeProgram,
  }) async {
    _user = await AuthService.instance.register(
      name: name,
      email: email,
      password: password,
      university: university,
      degreeProgram: degreeProgram,
    );
    notifyListeners();
    _afterSignIn();
  }

  Future<void> logout() async {
    _poll?.cancel();
    _poll = null;
    await AuthService.instance.logout();
    _user = null;
    jobs = const Load<List<Job>>([]);
    saved = const Load<List<Job>>([]);
    overview = const Load<Overview?>(null);
    applications = const Load<List<Application>>([]);
    interviews = const Load<List<Interview>>([]);
    notifications = const Load<List<AppNotification>>([]);
    unread = 0;
    query = const JobQuery();
    notifyListeners();
  }

  Future<void> refreshAll() async {
    await Future.wait([
      loadOverview(),
      loadJobs(),
      loadSaved(),
      loadApplications(),
      loadInterviews(),
      loadNotifications(),
    ]);
  }

  // ------------------------------------------------------------------- jobs

  Future<void> setQuery(JobQuery q) async {
    query = q;
    await loadJobs();
  }

  Future<void> loadJobs() async {
    jobs = jobs.copy(loading: true, clearError: true);
    notifyListeners();
    try {
      // "Best match" only makes sense with a token; the server falls back.
      final list = await JobService.instance.fetchJobs(query);
      jobs = Load(list, loaded: true);
    } on ApiException catch (e) {
      jobs = jobs.copy(loading: false, error: e.message);
    } catch (_) {
      jobs = jobs.copy(loading: false, error: 'Nimadir xato ketdi.');
    }
    notifyListeners();
  }

  Future<void> loadSaved() async {
    if (!isLoggedIn) return;
    saved = saved.copy(loading: true, clearError: true);
    notifyListeners();
    try {
      saved = Load(await JobService.instance.fetchSaved(), loaded: true);
    } on ApiException catch (e) {
      saved = saved.copy(loading: false, error: e.message);
    }
    notifyListeners();
  }

  Future<void> loadMeta() async {
    try {
      meta = await JobService.instance.fetchMeta();
      notifyListeners();
    } catch (_) {}
  }

  /// Finds a job in any cache (so detail screens open instantly).
  Job? cachedJob(String id) {
    for (final j in [
      ...jobs.data,
      ...saved.data,
      ...?overview.data?.recommended,
    ]) {
      if (j.id == id) return j;
    }
    return null;
  }

  bool isSaved(String jobId) => cachedJob(jobId)?.isSaved ?? false;

  /// Optimistic bookmark toggle with rollback.
  Future<void> toggleSaved(Job job) async {
    if (!isLoggedIn) return;
    final next = !isSaved(job.id);
    _patchJob(job.id, (j) => j.copyWith(isSaved: next));
    notifyListeners();
    try {
      final actual = await JobService.instance.toggleSave(job.id);
      _patchJob(job.id, (j) => j.copyWith(isSaved: actual));
      await loadSaved();
    } catch (_) {
      _patchJob(job.id, (j) => j.copyWith(isSaved: !next));
      notifyListeners();
      rethrow;
    }
  }

  void _patchJob(String id, Job Function(Job) f) {
    List<Job> map(List<Job> l) => l.map((j) => j.id == id ? f(j) : j).toList();
    jobs = jobs.copy(data: map(jobs.data));
    final ov = overview.data;
    if (ov != null) {
      overview = overview.copy(
        data: Overview(
          applied: ov.applied,
          saved: ov.saved,
          interviews: ov.interviews,
          offers: ov.offers,
          profileCompleteness: ov.profileCompleteness,
          nextInterview: ov.nextInterview,
          recentApplications: ov.recentApplications,
          recommended: map(ov.recommended),
          unreadNotifications: ov.unreadNotifications,
        ),
      );
    }
    notifyListeners();
  }

  // --------------------------------------------------------------- overview

  Future<void> loadOverview() async {
    if (!isLoggedIn) return;
    overview = overview.copy(loading: true, clearError: true);
    notifyListeners();
    try {
      overview = Load(await OverviewService.instance.fetch(), loaded: true);
    } on ApiException catch (e) {
      overview = overview.copy(loading: false, error: e.message);
    }
    notifyListeners();
  }

  // ----------------------------------------------------------- applications

  Future<void> loadApplications() async {
    if (!isLoggedIn) return;
    applications = applications.copy(loading: true, clearError: true);
    notifyListeners();
    try {
      applications =
          Load(await ApplicationService.instance.list(), loaded: true);
    } on ApiException catch (e) {
      applications = applications.copy(loading: false, error: e.message);
    }
    notifyListeners();
  }

  Application? applicationFor(String jobId) {
    for (final a in applications.data) {
      if (a.jobId == jobId) return a;
    }
    return null;
  }

  Future<Application> submitApplication({
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
    final app = await ApplicationService.instance.submit(
      jobId: jobId,
      firstName: firstName,
      lastName: lastName,
      address: address,
      city: city,
      university: university,
      phone: phone,
      email: email,
      skillLevel: skillLevel,
      coverNote: coverNote,
      resumeBytes: resumeBytes,
      resumeFileName: resumeFileName,
    );
    _patchJob(jobId, (j) => j.copyWith(applicationStatus: app.status));
    await Future.wait([
      loadApplications(),
      loadOverview(),
      loadNotifications(),
    ]);
    return app;
  }

  Future<Application> withdraw(String applicationId) async {
    final app = await ApplicationService.instance.withdraw(applicationId);
    _patchJob(app.jobId, (j) => j.copyWith(applicationStatus: app.status));
    await Future.wait([loadApplications(), loadOverview(), loadInterviews()]);
    return app;
  }

  // ------------------------------------------------------------- interviews

  Future<void> loadInterviews() async {
    if (!isLoggedIn) return;
    interviews = interviews.copy(loading: true, clearError: true);
    notifyListeners();
    try {
      interviews = Load(await InterviewService.instance.list(), loaded: true);
    } on ApiException catch (e) {
      interviews = interviews.copy(loading: false, error: e.message);
    }
    notifyListeners();
  }

  Future<Interview> bookInterview({
    required String jobId,
    String? applicationId,
    required String date,
    required String time,
    String? reason,
  }) async {
    final i = await InterviewService.instance.book(
      jobId: jobId,
      applicationId: applicationId,
      date: date,
      time: time,
      reason: reason,
    );
    await Future.wait([
      loadInterviews(),
      loadApplications(),
      loadOverview(),
      loadNotifications(),
    ]);
    return i;
  }

  Future<void> cancelInterview(String id) async {
    await InterviewService.instance.cancel(id);
    await Future.wait([loadInterviews(), loadOverview(), loadNotifications()]);
  }

  /// The soonest scheduled interview for an application, if any.
  Interview? scheduledInterviewFor(String applicationId) {
    for (final i in interviews.data) {
      if (i.isScheduled && i.applicationId == applicationId) return i;
    }
    return null;
  }

  // ---------------------------------------------------------- notifications

  Future<void> loadNotifications() async {
    if (!isLoggedIn) return;
    try {
      final page = await NotificationService.instance.fetch();
      notifications = Load(page.items, loaded: true);
      unread = page.unread;
    } on ApiException catch (e) {
      notifications = notifications.copy(loading: false, error: e.message);
    }
    notifyListeners();
  }

  Future<void> markNotificationRead(AppNotification n) async {
    if (n.isRead) return;
    notifications = notifications.copy(
      data: notifications.data.map((x) => x.id == n.id ? x.markRead() : x).toList(),
    );
    unread = unread > 0 ? unread - 1 : 0;
    notifyListeners();
    try {
      unread = await NotificationService.instance.markRead(n.id);
      notifyListeners();
    } catch (_) {}
  }

  Future<void> markAllNotificationsRead() async {
    notifications = notifications.copy(
      data: notifications.data.map((x) => x.markRead()).toList(),
    );
    unread = 0;
    notifyListeners();
    try {
      await NotificationService.instance.markAllRead();
    } catch (_) {}
  }

  void _startPolling() {
    _poll?.cancel();
    _poll = Timer.periodic(const Duration(seconds: 60), (_) => loadNotifications());
  }

  // ---------------------------------------------------------------- profile

  Future<void> updateProfile(Map<String, dynamic> fields) async {
    _user = await AuthService.instance.updateProfile(fields);
    notifyListeners();
    loadOverview();
  }

  Future<void> uploadProfilePhoto({
    required List<int> bytes,
    required String fileName,
  }) async {
    _user = await AuthService.instance.uploadProfilePhoto(
      bytes: bytes,
      fileName: fileName,
    );
    notifyListeners();
  }
}

class AppStateScope extends InheritedNotifier<AppState> {
  const AppStateScope({
    super.key,
    required AppState state,
    required super.child,
  }) : super(notifier: state);

  static AppState of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<AppStateScope>();
    assert(scope != null, 'No AppStateScope found in context');
    return scope!.notifier!;
  }
}
