import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../models/interview.dart';
import '../../services/api_client.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../utils/format.dart';
import '../../utils/ics.dart';
import '../../utils/routes.dart';
import '../../utils/toast.dart';
import '../../widgets/buttons.dart';
import '../../widgets/confetti_burst.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/monogram.dart';

/// Shown right after booking ([fresh]: check animation + confetti) and when
/// re-opening an existing interview (details, calendar copy, cancel).
class InterviewConfirmationScreen extends StatefulWidget {
  final Interview interview;
  final bool fresh;
  const InterviewConfirmationScreen({super.key, required this.interview, required this.fresh});

  @override
  State<InterviewConfirmationScreen> createState() => _InterviewConfirmationScreenState();
}

class _InterviewConfirmationScreenState extends State<InterviewConfirmationScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 800));
  bool _started = false;
  bool _busy = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    if (widget.fresh) HapticFeedback.mediumImpact();
    if (!widget.fresh || AppMotion.reduced(context)) {
      _c.value = 1;
    } else {
      _c.forward();
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  Future<void> _copyIcs() async {
    final i = widget.interview;
    final text = buildIcs(
      id: i.id,
      date: i.date,
      time: i.time,
      durationMin: i.durationMin,
      company: i.job.company,
      jobTitle: i.job.title,
      note: i.reason,
    );
    await Clipboard.setData(ClipboardData(text: text));
    if (mounted) showToast(context, 'Taqvim hodisasi nusxalandi. Import qilish uchun uni .ics faylga joylang.');
  }

  Future<void> _cancel() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.bgRaised,
        shape: RoundedRectangleBorder(borderRadius: AppRadii.mdR),
        title: Text('Intervyuni bekor qilasizmi?', style: AppText.h3),
        content: Text('Vaqt boshqa talabalar uchun boʻshatiladi. Keyin boshqa vaqtni belgilashingiz mumkin.',
            style: AppText.bodyMuted),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Qoldirish')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Intervyuni bekor qilish', style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    setState(() => _busy = true);
    try {
      await AppStateScope.of(context).cancelInterview(widget.interview.id);
      if (!mounted) return;
      showToast(context, 'Intervyu bekor qilindi');
      Navigator.of(context).pop();
    } on ApiException catch (e) {
      if (mounted) showToast(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final i = widget.interview;
    final cancellable = i.isScheduled && (parseSlot(i.date, i.time)?.isAfter(DateTime.now()) ?? false);
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          tooltip: widget.fresh ? 'Tayyor' : 'Orqaga',
          icon: Icon(widget.fresh ? Icons.close_rounded : Icons.arrow_back_rounded),
          onPressed: () => widget.fresh ? popToShell(context) : Navigator.of(context).pop(),
        ),
      ),
      body: Stack(children: [
        if (widget.fresh && !AppMotion.reduced(context)) const Positioned.fill(child: ConfettiBurst(count: 50)),
        SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(AppLayout.gutter + 4),
            children: [
              Center(
                child: ScaleTransition(
                  scale: CurvedAnimation(parent: _c, curve: Curves.elasticOut),
                  child: Container(
                    width: 92,
                    height: 92,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: i.isScheduled ? AppColors.aurora : null,
                      color: i.isScheduled ? null : AppColors.glassFillHover,
                    ),
                    child: Icon(i.isScheduled ? Icons.event_available_rounded : Icons.event_busy_rounded,
                        size: 46, color: i.isScheduled ? AppColors.bg : AppColors.muted),
                  ),
                ),
              ),
              const SizedBox(height: 22),
              Text(
                widget.fresh ? 'Intervyu belgilandi' : (i.isScheduled ? 'Intervyu' : 'Intervyu ${_statusLabel(i.status)}'),
                textAlign: TextAlign.center,
                style: AppText.display(28),
              ),
              const SizedBox(height: 6),
              Text(formatWhen(i.date, i.time),
                  textAlign: TextAlign.center, style: AppText.bodyMuted.copyWith(fontSize: 16)),
              const SizedBox(height: 24),
              GlassCard(
                padding: const EdgeInsets.all(16),
                child: Column(children: [
                  Row(children: [
                    Monogram(company: i.job.company, accent: i.job.accent, size: 44),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(i.job.title, style: AppText.display(16.5, weight: FontWeight.w600)),
                        Text(i.job.company, style: AppText.small),
                      ]),
                    ),
                  ]),
                  const Divider(height: 28, color: AppColors.glassStroke),
                  _row(Icons.schedule_rounded, '${i.durationMin} daqiqa'),
                  if (i.reason.isNotEmpty) ...[const SizedBox(height: 10), _row(Icons.notes_rounded, i.reason)],
                ]),
              ),
              const SizedBox(height: 22),
              if (i.isScheduled)
                GhostButton(label: 'Taqvim hodisasini nusxalash', icon: Icons.calendar_month_rounded, onPressed: _copyIcs),
              if (cancellable) ...[
                const SizedBox(height: 10),
                GhostButton(
                  label: 'Intervyuni bekor qilish',
                  icon: Icons.event_busy_rounded,
                  color: AppColors.danger,
                  onPressed: _busy ? null : _cancel,
                ),
              ],
              if (widget.fresh) ...[
                const SizedBox(height: 10),
                PrimaryButton(label: 'Tayyor', onPressed: () => popToShell(context)),
              ],
            ],
          ),
        ),
      ]),
    );
  }

  Widget _row(IconData icon, String text) => Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(icon, size: 18, color: AppColors.muted),
        const SizedBox(width: 10),
        Expanded(child: Text(text, style: AppText.body)),
      ]);
}

String _statusLabel(String status) {
  switch (status) {
    case 'cancelled':
      return 'bekor qilingan';
    case 'completed':
      return 'yakunlangan';
    default:
      return status;
  }
}
