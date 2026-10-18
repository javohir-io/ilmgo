import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../models/application.dart';
import '../../models/job.dart';
import '../../theme/app_theme.dart';
import '../../utils/routes.dart';
import '../../widgets/buttons.dart';
import '../../widgets/confetti_burst.dart';
import '../pipeline/application_detail_screen.dart';

class ApplySuccessScreen extends StatefulWidget {
  final Application application;
  final Job job;
  const ApplySuccessScreen({super.key, required this.application, required this.job});

  @override
  State<ApplySuccessScreen> createState() => _ApplySuccessScreenState();
}

class _ApplySuccessScreenState extends State<ApplySuccessScreen> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    HapticFeedback.mediumImpact();
    if (AppMotion.reduced(context)) {
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(children: [
        if (!AppMotion.reduced(context)) const Positioned.fill(child: ConfettiBurst()),
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(AppLayout.gutter + 4),
            child: Column(children: [
              const Spacer(),
              ScaleTransition(
                scale: CurvedAnimation(parent: _c, curve: Curves.elasticOut),
                child: Container(
                  width: 112,
                  height: 112,
                  decoration: const BoxDecoration(shape: BoxShape.circle, gradient: AppColors.aurora),
                  child: const Icon(Icons.check_rounded, size: 64, color: AppColors.bg),
                ),
              ),
              const SizedBox(height: 28),
              Text('Ariza yuborildi', style: AppText.display(30)),
              const SizedBox(height: 10),
              Text(
                '${widget.job.company} kompaniyasi “${widget.job.title}” boʻyicha arizangizni oldi. Holati oʻzgarishi bilan sizga xabar beramiz.',
                textAlign: TextAlign.center,
                style: AppText.bodyMuted.copyWith(fontSize: 15),
              ),
              const Spacer(),
              PrimaryButton(
                label: 'Arizani kuzatish',
                icon: Icons.route_rounded,
                onPressed: () => Navigator.of(context).pushAndRemoveUntil(
                  appRoute(ApplicationDetailScreen(applicationId: widget.application.id)),
                  (r) => r.isFirst,
                ),
              ),
              const SizedBox(height: 10),
              GhostButton(label: 'Vakansiyalarga qaytish', onPressed: () => popToShell(context)),
            ]),
          ),
        ),
      ]),
    );
  }
}
