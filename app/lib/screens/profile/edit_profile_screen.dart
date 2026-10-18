import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

import '../../services/api_client.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../utils/toast.dart';
import '../../utils/validators.dart';
import '../../widgets/app_field.dart';
import '../../widgets/avatar.dart';
import '../../widgets/buttons.dart';
import '../../widgets/chips.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _title = TextEditingController();
  final _phone = TextEditingController();
  final _university = TextEditingController();
  final _degree = TextEditingController();
  final _year = TextEditingController();
  final _about = TextEditingController();
  final _github = TextEditingController();
  final _linkedin = TextEditingController();
  final _skillInput = TextEditingController();
  List<String> _skills = [];
  bool _busy = false;
  bool _init = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_init) return;
    _init = true;
    final u = AppStateScope.of(context).currentUser;
    if (u == null) return;
    _name.text = u.name;
    _title.text = u.title;
    _phone.text = u.phone;
    _university.text = u.university;
    _degree.text = u.degreeProgram;
    _year.text = u.graduationYear?.toString() ?? '';
    _about.text = u.about;
    _github.text = u.githubUrl;
    _linkedin.text = u.linkedinUrl;
    _skills = [...u.skills];
  }

  @override
  void dispose() {
    for (final c in [_name, _title, _phone, _university, _degree, _year, _about, _github, _linkedin, _skillInput]) {
      c.dispose();
    }
    super.dispose();
  }

  void _addSkill(String raw) {
    final s = raw.trim();
    if (s.isEmpty) return;
    if (_skills.length >= 30) {
      showToast(context, 'Koʻpi bilan 30 ta koʻnikma qoʻshish mumkin', error: true);
      return;
    }
    if (_skills.any((e) => e.toLowerCase() == s.toLowerCase())) {
      _skillInput.clear();
      return;
    }
    setState(() => _skills.add(s));
    _skillInput.clear();
  }

  Future<void> _photo() async {
    final state = AppStateScope.of(context);
    try {
      final res = await FilePicker.platform.pickFiles(type: FileType.image, withData: true);
      if (res == null || res.files.isEmpty) return;
      final f = res.files.first;
      if (f.bytes == null) return;
      if (f.size > 5 * 1024 * 1024) {
        if (mounted) showToast(context, 'Rasm hajmi 5 MB dan oshmasligi kerak', error: true);
        return;
      }
      await state.uploadProfilePhoto(bytes: f.bytes!, fileName: f.name);
      if (mounted) showToast(context, 'Rasm yangilandi');
    } on ApiException catch (e) {
      if (mounted) showToast(context, e.message, error: true);
    } catch (_) {
      if (mounted) showToast(context, 'Bu rasmdan foydalanib boʻlmadi', error: true);
    }
  }

  Future<void> _save() async {
    FocusScope.of(context).unfocus();
    if (!_form.currentState!.validate()) return;
    // A skill typed but not yet confirmed still counts.
    if (_skillInput.text.trim().isNotEmpty) _addSkill(_skillInput.text);
    final year = int.tryParse(_year.text.trim());
    setState(() => _busy = true);
    try {
      await AppStateScope.of(context).updateProfile({
        'name': _name.text.trim(),
        'title': _title.text.trim(),
        'phone': _phone.text.trim(),
        'university': _university.text.trim(),
        'degreeProgram': _degree.text.trim(),
        if (year != null) 'graduationYear': year,
        'about': _about.text.trim(),
        'githubUrl': normalizeUrl(_github.text),
        'linkedinUrl': normalizeUrl(_linkedin.text),
        'skills': _skills,
      });
      if (!mounted) return;
      showToast(context, 'Profil saqlandi');
      Navigator.of(context).pop();
    } on ApiException catch (e) {
      if (mounted) showToast(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateScope.of(context);
    final u = state.currentUser;
    final suggestions = state.meta.skills
        .where((s) => !_skills.any((e) => e.toLowerCase() == s.toLowerCase()))
        .take(10)
        .toList();
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Text('Profilni tahrirlash', style: AppText.h3),
      ),
      body: SafeArea(
        child: Column(children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(AppLayout.gutter, 4, AppLayout.gutter, 24),
              child: Form(
                key: _form,
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Center(
                    child: GestureDetector(
                      onTap: _photo,
                      child: Stack(children: [
                        Avatar(name: u?.name ?? '', photoUrl: u?.profilePhotoUrl, size: 92),
                        Positioned(
                          right: 0,
                          bottom: 0,
                          child: Container(
                            padding: const EdgeInsets.all(6),
                            decoration: const BoxDecoration(shape: BoxShape.circle, color: AppColors.azure),
                            child: const Icon(Icons.photo_camera_rounded, size: 16, color: AppColors.text),
                          ),
                        ),
                      ]),
                    ),
                  ),
                  const SizedBox(height: 22),
                  AppField(
                    label: 'Toʻliq ism',
                    controller: _name,
                    validator: (v) => (v ?? '').trim().length < 2 ? 'Ismingizni kiriting' : null,
                  ),
                  const SizedBox(height: 14),
                  AppField(label: 'Kasbiy sarlavha', controller: _title, hint: 'masalan, IT talabasi, mobil dasturchi'),
                  const SizedBox(height: 14),
                  AppField(label: 'Telefon', controller: _phone, keyboardType: TextInputType.phone),
                  const SizedBox(height: 14),
                  AppField(label: 'Universitet', controller: _university),
                  const SizedBox(height: 14),
                  Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Expanded(flex: 3, child: AppField(label: 'Taʼlim yoʻnalishi', controller: _degree)),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: AppField(
                        label: 'Bitirish yili',
                        controller: _year,
                        keyboardType: TextInputType.number,
                        validator: (v) {
                          final t = (v ?? '').trim();
                          if (t.isEmpty) return null;
                          final n = int.tryParse(t);
                          return n == null || n < 1990 || n > 2100 ? 'Yil' : null;
                        },
                      ),
                    ),
                  ]),
                  const SizedBox(height: 14),
                  AppField(label: 'Oʻzingiz haqingizda', controller: _about, maxLines: 4),
                  const SizedBox(height: 22),
                  Text('Koʻnikmalar', style: AppText.label),
                  const SizedBox(height: 10),
                  if (_skills.isNotEmpty)
                    Wrap(spacing: 8, runSpacing: 8, children: [
                      for (final s in _skills)
                        SkillChip(s, matched: true, onRemove: () => setState(() => _skills.remove(s))),
                    ]),
                  const SizedBox(height: 10),
                  AppField(
                    label: 'Koʻnikma qoʻshish',
                    controller: _skillInput,
                    action: TextInputAction.done,
                    onSubmitted: _addSkill,
                    suffix: IconButton(
                      tooltip: 'Koʻnikma qoʻshish',
                      icon: const Icon(Icons.add_circle_rounded, color: AppColors.sky),
                      onPressed: () => _addSkill(_skillInput.text),
                    ),
                  ),
                  if (suggestions.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Text('Ilmgoʻda mashhur', style: AppText.caption),
                    const SizedBox(height: 8),
                    Wrap(spacing: 8, runSpacing: 8, children: [
                      for (final s in suggestions) SkillChip(s, onTap: () => _addSkill(s)),
                    ]),
                  ],
                  const SizedBox(height: 22),
                  AppField(
                    label: 'GitHub',
                    controller: _github,
                    keyboardType: TextInputType.url,
                    validator: (v) => isValidUrl(v ?? '') ? null : 'Toʻgʻri havola kiriting',
                  ),
                  const SizedBox(height: 14),
                  AppField(
                    label: 'LinkedIn',
                    controller: _linkedin,
                    keyboardType: TextInputType.url,
                    validator: (v) => isValidUrl(v ?? '') ? null : 'Toʻgʻri havola kiriting',
                  ),
                ]),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(AppLayout.gutter, 8, AppLayout.gutter, 16),
            child: PrimaryButton(label: 'Oʻzgarishlarni saqlash', loading: _busy, onPressed: _save),
          ),
        ]),
      ),
    );
  }
}
