import 'package:flutter/material.dart';

import '../../models/application.dart';
import '../../services/api_client.dart';
import '../../services/application_service.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../utils/format.dart';
import '../../utils/routes.dart';
import '../../utils/toast.dart';
import '../../widgets/buttons.dart';
import '../../widgets/chips.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/monogram.dart';
import '../../widgets/states.dart';
import '../interviews/interview_confirmation_screen.dart';
import '../interviews/schedule_interview_screen.dart';
import '../jobs/job_detail_screen.dart';
import 'pipeline_screen.dart' show StageTrack;

class ApplicationDetailScreen extends StatefulWidget {
  final String applicationId;
  const ApplicationDetailScreen({super.key, required this.applicationId});

  @override
  State<ApplicationDetailScreen> createState() => _ApplicationDetailScreenState();
}

class _ApplicationDetailScreenState extends State<ApplicationDetailScreen> {
  Application? _app; // detail copy, includes the event timeline
  String? _error;
  bool _busy = false;
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    final state = AppStateScope.of(context);
    for (final a in state.applications.data) {
      if (a.id == widget.applicationId) _app = a;
    }
    _load();
  }

  Future<void> _load() async {
    setState(() => _error = null);
    try {
      final a = await ApplicationService.instance.detail(widget.applicationId);
      if (mounted) setState(() => _app = a);
    } on ApiException catch (e) {
      if (mounted && _app == null) setState(() => _error = e.message);
    }
  }

  Future<void> _withdraw() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.bgRaised,
        shape: RoundedRectangleBorder(borderRadius: AppRadii.mdR),
        title: Text('Arizani bekor qilasizmi?', style: AppText.h3),
        content: Text('Bu vakansiya boʻyicha belgilangan intervyu ham bekor qilinadi. Buni qaytarib boʻlmaydi.',
            style: AppText.bodyMuted),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Qoldirish')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Bekor qilish', style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    setState(() => _busy = true);
    try {
      final updated = await AppStateScope.of(context).withdraw(widget.applicationId);
      if (mounted) {
        setState(() => _app = updated);
        showToast(context, 'Ariza bekor qilindi');
        _load();
      }
    } on ApiException catch (e) {
      if (mounted) showToast(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateScope.of(context);
    final app = _app;
    if (app == null) {
      return Scaffold(
        appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
        body: _error != null
            ? ErrorState(message: _error!, onRetry: _load)
            : const Center(child: CircularProgressIndicator(color: AppColors.sky)),
      );
    }
    final interview = state.scheduledInterviewFor(app.id);
    final events = [...app.events]..sort((a, b) =>
        (b.createdAt ?? DateTime(0)).compareTo(a.createdAt ?? DateTime(0)));

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Text('Ariza', style: AppText.h3),
      ),
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.sky,
          backgroundColor: AppColors.bgRaised,
          onRefresh: _load,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(AppLayout.gutter, 4, AppLayout.gutter, 32),
            children: [
              GlassCard(
                onTap: () => Navigator.of(context)
                    .push(appRoute(JobDetailScreen(jobId: app.jobId, heroScope: 'app'))),
                padding: const EdgeInsets.all(16),
                child: Row(children: [
                  Monogram(company: app.job.company, accent: app.job.accent, size: 48),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(app.job.title, style: AppText.display(18, weight: FontWeight.w600)),
                      const SizedBox(height: 2),
                      Text('${app.job.company} · ${formatShortDate(app.createdAt)} kuni yuborilgan', style: AppText.small),
                    ]),
                  ),
                  const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
                ]),
              ),
              const SizedBox(height: 16),
              GlassCard(
                padding: const EdgeInsets.all(18),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Text('Holati', style: AppText.label),
                    const Spacer(),
                    StatusPill(app.status),
                  ]),
                  const SizedBox(height: 18),
                  StageTrack(stage: app.stage, closed: app.isClosed, status: app.status),
                ]),
              ),
              if (interview != null) ...[
                const SizedBox(height: 16),
                GlassCard(
                  tint: AppColors.azure,
                  onTap: () => Navigator.of(context)
                      .push(appRoute(InterviewConfirmationScreen(interview: interview, fresh: false))),
                  padding: const EdgeInsets.all(16),
                  child: Row(children: [
                    const Icon(Icons.event_available_rounded, color: AppColors.text),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('Intervyu belgilangan', style: AppText.small),
                        Text(formatWhen(interview.date, interview.time),
                            style: AppText.inter(15, weight: FontWeight.w600)),
                      ]),
                    ),
                    const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
                  ]),
                ),
              ] else if (app.canSchedule) ...[
                const SizedBox(height: 16),
                PrimaryButton(
                  label: 'Intervyu belgilash',
                  icon: Icons.event_rounded,
                  onPressed: () => Navigator.of(context).push(appRoute(ScheduleInterviewScreen(application: app))),
                ),
              ],
              const SizedBox(height: 26),
              Text('Tarix', style: AppText.h3),
              const SizedBox(height: 12),
              if (events.isEmpty)
                Text('Hozircha yangilanishlar yoʻq.', style: AppText.bodyMuted)
              else
                for (var i = 0; i < events.length; i++)
                  _TimelineRow(event: events[i], first: i == 0, last: i == events.length - 1),
              if (app.canSchedule) ...[
                const SizedBox(height: 24),
                GhostButton(
                  label: 'Arizani bekor qilish',
                  icon: Icons.undo_rounded,
                  color: AppColors.danger,
                  onPressed: _busy ? null : _withdraw,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _TimelineRow extends StatelessWidget {
  final ApplicationEvent event;
  final bool first;
  final bool last;
  const _TimelineRow({required this.event, required this.first, required this.last});

  @override
  Widget build(BuildContext context) {
    final c = AppStatus.color(event.status);
    return IntrinsicHeight(
      child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        SizedBox(
          width: 28,
          child: Column(children: [
            Container(
              width: 14,
              height: 14,
              margin: const EdgeInsets.only(top: 3),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: first ? c : c.withOpacity(0.35),
                boxShadow: first ? [BoxShadow(color: c.withOpacity(0.5), blurRadius: 10)] : null,
              ),
            ),
            if (!last) Expanded(child: Container(width: 2, color: AppColors.glassStroke)),
          ]),
        ),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(bottom: 18),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(AppStatus.label(event.status), style: AppText.inter(14.5, weight: FontWeight.w600)),
              if (event.note.isNotEmpty) ...[
                const SizedBox(height: 2),
                Text(event.note, style: AppText.bodyMuted),
              ],
              const SizedBox(height: 2),
              Text(formatStamp(event.createdAt), style: AppText.caption),
            ]),
          ),
        ),
      ]),
    );
  }
}
