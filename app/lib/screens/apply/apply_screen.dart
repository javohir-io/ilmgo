import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

import '../../models/application.dart';
import '../../models/job.dart';
import '../../services/api_client.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../utils/format.dart';
import '../../utils/labels.dart';
import '../../utils/routes.dart';
import '../../utils/validators.dart';
import '../../widgets/app_field.dart';
import '../../widgets/buttons.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/monogram.dart';
import 'apply_success_screen.dart';

const int _maxResumeBytes = 10 * 1024 * 1024;

/// Three steps: details, resume + level, review. Server-side 409 (already
/// applied) is handled by closing the flow and showing the existing application.
class ApplyScreen extends StatefulWidget {
  final Job job;
  const ApplyScreen({super.key, required this.job});

  @override
  State<ApplyScreen> createState() => _ApplyScreenState();
}

class _ApplyScreenState extends State<ApplyScreen> {
  final _formA = GlobalKey<FormState>();
  final _formB = GlobalKey<FormState>();
  final _first = TextEditingController();
  final _last = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _university = TextEditingController();
  final _address = TextEditingController();
  final _city = TextEditingController();
  final _cover = TextEditingController();

  int _step = 0;
  String _level = 'Intermediate';
  PlatformFile? _file;
  String? _fileError;
  String? _error;
  bool _busy = false;
  bool _prefilled = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_prefilled) return;
    _prefilled = true;
    final u = AppStateScope.of(context).currentUser;
    if (u == null) return;
    final parts = splitName(u.name);
    _first.text = parts[0];
    _last.text = parts[1];
    _email.text = u.email;
    _phone.text = u.phone;
    _university.text = u.university;
  }

  @override
  void dispose() {
    for (final c in [_first, _last, _email, _phone, _university, _address, _city, _cover]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _pick() async {
    try {
      final res = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: const ['pdf', 'doc', 'docx'],
        withData: true,
      );
      if (res == null || res.files.isEmpty) return;
      final f = res.files.first;
      if (f.size > _maxResumeBytes) {
        setState(() {
          _file = null;
          _fileError = 'Fayl hajmi ${formatBytes(f.size)}. Chegara 10 MB.';
        });
        return;
      }
      if (f.bytes == null) {
        setState(() => _fileError = 'Faylni oʻqib boʻlmadi. Boshqasini tanlang.');
        return;
      }
      setState(() {
        _file = f;
        _fileError = null;
      });
    } catch (_) {
      setState(() => _fileError = 'Fayl tanlashda xatolik. Qayta urinib koʻring.');
    }
  }

  void _next() {
    FocusScope.of(context).unfocus();
    if (_step == 0) {
      if (!_formA.currentState!.validate()) return;
    } else if (_step == 1) {
      var ok = _formB.currentState!.validate();
      if (_file == null) {
        setState(() => _fileError ??= 'Rezyumeni biriktiring (PDF, DOC yoki DOCX).');
        ok = false;
      }
      if (!ok) return;
    }
    setState(() => _step++);
  }

  Future<void> _submit() async {
    final state = AppStateScope.of(context);
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final Application app = await state.submitApplication(
        jobId: widget.job.id,
        firstName: _first.text.trim(),
        lastName: _last.text.trim(),
        address: _address.text.trim(),
        city: _city.text.trim(),
        university: _university.text.trim(),
        phone: _phone.text.trim(),
        email: _email.text.trim(),
        skillLevel: _level,
        coverNote: _cover.text.trim(),
        resumeBytes: _file!.bytes!,
        resumeFileName: _file!.name,
      );
      if (!mounted) return;
      Navigator.of(context).pushReplacement(appRoute(ApplySuccessScreen(application: app, job: widget.job)));
    } on ApiException catch (e) {
      if (!mounted) return;
      if (e.isConflict) {
        await state.loadApplications();
        if (!mounted) return;
        setState(() => _error = 'Siz bu vakansiyaga allaqachon ariza yuborgansiz. Arizalar boʻlimini tekshiring.');
      } else {
        setState(() => _error = e.message);
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final job = widget.job;
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          tooltip: _step == 0 ? 'Yopish' : 'Oldingi qadam',
          icon: Icon(_step == 0 ? Icons.close_rounded : Icons.arrow_back_rounded),
          onPressed: _busy ? null : () => _step == 0 ? Navigator.of(context).pop() : setState(() => _step--),
        ),
        title: Text('Ariza yuborish', style: AppText.h3),
      ),
      body: SafeArea(
        child: Column(children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(AppLayout.gutter, 0, AppLayout.gutter, 12),
            child: Row(children: [
              Monogram(company: job.company, accent: job.accent, size: 36),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(job.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: AppText.label),
                  Text(job.company, style: AppText.small),
                ]),
              ),
            ]),
          ),
          _Progress(step: _step, labels: const ['Maʼlumotlar', 'Rezyume', 'Tekshirish']),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(AppLayout.gutter, 20, AppLayout.gutter, 24),
              child: AnimatedSwitcher(
                duration: AppMotion.base,
                switchInCurve: AppMotion.expoOut,
                child: KeyedSubtree(key: ValueKey(_step), child: [_stepDetails(), _stepResume(), _stepReview()][_step]),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(AppLayout.gutter, 8, AppLayout.gutter, 16),
            child: PrimaryButton(
              label: _step == 2 ? 'Ariza yuborish' : 'Davom etish',
              icon: _step == 2 ? Icons.send_rounded : null,
              loading: _busy,
              onPressed: _step == 2 ? _submit : _next,
            ),
          ),
        ]),
      ),
    );
  }

  Widget _stepDetails() => Form(
        key: _formA,
        child: Column(children: [
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Expanded(
              child: AppField(
                label: 'Ism',
                controller: _first,
                action: TextInputAction.next,
                validator: (v) => (v ?? '').trim().isEmpty ? 'Majburiy' : null,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: AppField(
                label: 'Familiya',
                controller: _last,
                action: TextInputAction.next,
                validator: (v) => (v ?? '').trim().isEmpty ? 'Majburiy' : null,
              ),
            ),
          ]),
          const SizedBox(height: 14),
          AppField(
            label: 'Email',
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            action: TextInputAction.next,
            validator: (v) => isValidEmail(v ?? '') ? null : 'Toʻgʻri email kiriting',
          ),
          const SizedBox(height: 14),
          AppField(
            label: 'Telefon',
            controller: _phone,
            keyboardType: TextInputType.phone,
            action: TextInputAction.next,
            validator: (v) => (v ?? '').replaceAll(RegExp(r'\D'), '').length < 7 ? 'Toʻgʻri telefon raqamini kiriting' : null,
          ),
          const SizedBox(height: 14),
          AppField(label: 'Universitet', controller: _university, action: TextInputAction.next),
          const SizedBox(height: 14),
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Expanded(flex: 3, child: AppField(label: 'Manzil', controller: _address, action: TextInputAction.next)),
            const SizedBox(width: 12),
            Expanded(flex: 2, child: AppField(label: 'Shahar', controller: _city, action: TextInputAction.done)),
          ]),
        ]),
      );

  Widget _stepResume() => Form(
        key: _formB,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Bilim darajangiz', style: AppText.label),
          const SizedBox(height: 10),
          SegmentedButton<String>(
            showSelectedIcon: false,
            segments: [
              for (final l in const ['Beginner', 'Intermediate', 'Advanced'])
                ButtonSegment(value: l, label: Text(skillLevelLabel(l))),
            ],
            selected: {_level},
            onSelectionChanged: (s) => setState(() => _level = s.first),
          ),
          const SizedBox(height: 22),
          Text('Rezyume', style: AppText.label),
          const SizedBox(height: 10),
          GlassCard(
            onTap: _pick,
            padding: const EdgeInsets.all(18),
            child: Row(children: [
              Icon(_file == null ? Icons.upload_file_rounded : Icons.description_rounded,
                  color: _file == null ? AppColors.muted : AppColors.sky, size: 28),
              const SizedBox(width: 14),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(_file?.name ?? 'Fayl tanlang', maxLines: 1, overflow: TextOverflow.ellipsis, style: AppText.label),
                  const SizedBox(height: 2),
                  Text(_file == null ? 'PDF, DOC yoki DOCX, 10 MB gacha' : formatBytes(_file!.size), style: AppText.small),
                ]),
              ),
              if (_file != null)
                IconButton(
                  tooltip: 'Faylni olib tashlash',
                  icon: const Icon(Icons.close_rounded, size: 20),
                  onPressed: () => setState(() => _file = null),
                ),
            ]),
          ),
          if (_fileError != null) ...[
            const SizedBox(height: 8),
            Text(_fileError!, style: AppText.inter(12.5, color: AppColors.danger)),
          ],
          const SizedBox(height: 22),
          AppField(
            label: 'Hamroh xat (ixtiyoriy)',
            controller: _cover,
            maxLines: 5,
            hint: 'Nega aynan siz mos kelasiz?',
            validator: (v) => (v ?? '').length > 2000 ? '2000 belgidan oshmasin' : null,
          ),
        ]),
      );

  Widget _stepReview() {
    Widget row(String k, String v) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 7),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            SizedBox(width: 96, child: Text(k, style: AppText.small)),
            Expanded(child: Text(v.isEmpty ? '-' : v, style: AppText.body)),
          ]),
        );
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Hammasini tekshiring', style: AppText.display(22)),
      const SizedBox(height: 14),
      GlassCard(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          row('Ism', '${_first.text.trim()} ${_last.text.trim()}'),
          row('Email', _email.text.trim()),
          row('Telefon', _phone.text.trim()),
          row('Universitet', _university.text.trim()),
          row('Joylashuv', [_address.text.trim(), _city.text.trim()].where((e) => e.isNotEmpty).join(', ')),
          row('Daraja', skillLevelLabel(_level)),
          row('Rezyume', _file?.name ?? ''),
          if (_cover.text.trim().isNotEmpty) row('Hamroh xat', _cover.text.trim()),
        ]),
      ),
      if (_error != null) ...[
        const SizedBox(height: 14),
        Text(_error!, style: AppText.inter(13.5, color: AppColors.danger)),
      ],
    ]);
  }
}

class _Progress extends StatelessWidget {
  final int step;
  final List<String> labels;
  const _Progress({required this.step, required this.labels});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppLayout.gutter),
      child: Row(children: [
        for (var i = 0; i < labels.length; i++) ...[
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              AnimatedContainer(
                duration: AppMotion.base,
                curve: AppMotion.expoOut,
                height: 4,
                decoration: BoxDecoration(
                  borderRadius: AppRadii.pillR,
                  gradient: i <= step ? AppColors.aurora : null,
                  color: i <= step ? null : AppColors.glassStroke,
                ),
              ),
              const SizedBox(height: 6),
              Text(labels[i],
                  style: AppText.inter(12, weight: FontWeight.w600, color: i <= step ? AppColors.text : AppColors.faint)),
            ]),
          ),
          if (i < labels.length - 1) const SizedBox(width: 8),
        ],
      ]),
    );
  }
}
