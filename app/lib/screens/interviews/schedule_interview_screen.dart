import 'package:flutter/material.dart';

import '../../models/application.dart';
import '../../models/interview.dart';
import '../../services/api_client.dart';
import '../../services/interview_service.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../utils/format.dart';
import '../../utils/routes.dart';
import '../../widgets/app_field.dart';
import '../../widgets/buttons.dart';
import '../../widgets/glass_card.dart';
import 'interview_confirmation_screen.dart';

/// Pick a weekday, then one of the open 30-minute slots the server reports.
/// A 409 on booking means someone took the slot first: the slots reload.
class ScheduleInterviewScreen extends StatefulWidget {
  final Application application;
  const ScheduleInterviewScreen({super.key, required this.application});

  @override
  State<ScheduleInterviewScreen> createState() => _ScheduleInterviewScreenState();
}

class _ScheduleInterviewScreenState extends State<ScheduleInterviewScreen> {
  final _reason = TextEditingController();
  DateTime? _day;
  List<SlotInfo> _slots = const [];
  String? _time;
  bool _loadingSlots = false;
  bool _booking = false;
  String? _error;

  late final DateTime _first = _nextWeekday(DateTime.now().add(const Duration(days: 1)));
  late final DateTime _last = DateTime.now().add(const Duration(days: 60));

  static DateTime _nextWeekday(DateTime d) {
    var x = DateTime(d.year, d.month, d.day);
    while (x.weekday > 5) {
      x = x.add(const Duration(days: 1));
    }
    return x;
  }

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  Future<void> _loadSlots(DateTime day) async {
    setState(() {
      _day = day;
      _time = null;
      _error = null;
      _loadingSlots = true;
    });
    try {
      final s = await InterviewService.instance.slots(jobId: widget.application.jobId, date: dayKey(day));
      if (mounted && _day == day) setState(() => _slots = s);
    } on ApiException catch (e) {
      if (mounted) setState(() {
        _slots = const [];
        _error = e.message;
      });
    } finally {
      if (mounted) setState(() => _loadingSlots = false);
    }
  }

  Future<void> _book() async {
    final state = AppStateScope.of(context);
    setState(() {
      _booking = true;
      _error = null;
    });
    try {
      final i = await state.bookInterview(
        jobId: widget.application.jobId,
        applicationId: widget.application.id,
        date: dayKey(_day!),
        time: _time!,
        reason: _reason.text,
      );
      if (!mounted) return;
      Navigator.of(context).pushReplacement(appRoute(InterviewConfirmationScreen(interview: i, fresh: true)));
    } on ApiException catch (e) {
      if (!mounted) return;
      if (e.isConflict) {
        setState(() => _error = 'Bu vaqtni hozirgina boshqa kishi band qildi. Boshqa vaqtni tanlang.');
        await _loadSlots(_day!);
      } else {
        setState(() => _error = e.message);
      }
    } finally {
      if (mounted) setState(() => _booking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = widget.application;
    final open = _slots.where((s) => s.available).length;
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Text('Intervyu belgilash', style: AppText.h3),
      ),
      body: SafeArea(
        child: Column(children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(AppLayout.gutter, 0, AppLayout.gutter, 24),
              children: [
                Text('${app.job.title} · ${app.job.company}', style: AppText.bodyMuted),
                const SizedBox(height: 14),
                GlassCard(
                  padding: const EdgeInsets.all(6),
                  child: Theme(
                    data: Theme.of(context).copyWith(
                      colorScheme: Theme.of(context).colorScheme.copyWith(
                            primary: AppColors.azure,
                            surface: Colors.transparent,
                          ),
                    ),
                    child: CalendarDatePicker(
                      initialDate: _day ?? _first,
                      firstDate: _first,
                      lastDate: _last,
                      selectableDayPredicate: (d) => d.weekday <= 5,
                      onDateChanged: _loadSlots,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                if (_day == null)
                  Text('Boʻsh vaqtlarni koʻrish uchun kunni tanlang. Dam olish kunlari mavjud emas.', style: AppText.bodyMuted)
                else ...[
                  Text(formatDay(dayKey(_day!)), style: AppText.h3),
                  const SizedBox(height: 10),
                  if (_loadingSlots)
                    const Padding(
                      padding: EdgeInsets.all(24),
                      child: Center(child: CircularProgressIndicator(color: AppColors.sky, strokeWidth: 2.5)),
                    )
                  else if (open == 0)
                    Text('Bu kunda boʻsh vaqt yoʻq. Boshqa kunni tanlang.', style: AppText.bodyMuted)
                  else
                    Wrap(spacing: 8, runSpacing: 8, children: [
                      for (final s in _slots)
                        _SlotChip(
                          label: formatTime12(s.time),
                          available: s.available,
                          selected: _time == s.time,
                          onTap: () => setState(() => _time = s.time),
                        ),
                    ]),
                ],
                if (_time != null) ...[
                  const SizedBox(height: 22),
                  AppField(
                    label: 'Intervyu oluvchi bilishi kerak boʻlgan narsa bormi? (ixtiyoriy)',
                    controller: _reason,
                    maxLines: 3,
                  ),
                ],
                if (_error != null) ...[
                  const SizedBox(height: 14),
                  Text(_error!, style: AppText.inter(13.5, color: AppColors.danger)),
                ],
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(AppLayout.gutter, 8, AppLayout.gutter, 16),
            child: PrimaryButton(
              label: _time == null ? 'Vaqtni tanlang' : '${formatTime12(_time!)} ga belgilash',
              loading: _booking,
              onPressed: _time == null ? null : _book,
            ),
          ),
        ]),
      ),
    );
  }
}

class _SlotChip extends StatelessWidget {
  final String label;
  final bool available;
  final bool selected;
  final VoidCallback onTap;
  const _SlotChip({required this.label, required this.available, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      enabled: available,
      selected: selected,
      label: available ? label : '$label, band',
      child: GestureDetector(
        onTap: available ? onTap : null,
        child: AnimatedContainer(
          duration: AppMotion.micro,
          constraints: const BoxConstraints(minWidth: 84, minHeight: 44),
          alignment: Alignment.center,
          padding: const EdgeInsets.symmetric(horizontal: 14),
          decoration: BoxDecoration(
            borderRadius: AppRadii.pillR,
            color: selected ? AppColors.azure.withOpacity(0.3) : AppColors.glassFill,
            border: Border.all(color: selected ? AppColors.azureBright : AppColors.glassStroke),
          ),
          child: Text(
            label,
            style: AppText.inter(14,
                weight: FontWeight.w600,
                color: available ? AppColors.text : AppColors.faint)
                .copyWith(decoration: available ? null : TextDecoration.lineThrough),
          ),
        ),
      ),
    );
  }
}
