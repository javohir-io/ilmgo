import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../utils/routes.dart';
import '../../utils/toast.dart';
import '../../widgets/job_card.dart';
import '../../widgets/shimmer_box.dart';
import '../../widgets/states.dart';
import '../jobs/job_detail_screen.dart';

class SavedScreen extends StatelessWidget {
  const SavedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = AppStateScope.of(context);
    final saved = state.saved;
    return SafeArea(
      bottom: false,
      child: RefreshIndicator(
        color: AppColors.sky,
        backgroundColor: AppColors.bgRaised,
        onRefresh: state.loadSaved,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(AppLayout.gutter, 16, AppLayout.gutter, AppLayout.navClearance),
          children: [
            Text('Saqlangan', style: AppText.display(32)),
            const SizedBox(height: 4),
            Text('Keyinroq koʻrish uchun saqlagan vakansiyalaringiz.', style: AppText.bodyMuted),
            const SizedBox(height: 20),
            if (!saved.loaded && saved.loading)
              for (var i = 0; i < 3; i++)
                const Padding(padding: EdgeInsets.only(bottom: 12), child: JobCardSkeleton())
            else if (saved.error != null && saved.data.isEmpty)
              ErrorState(message: saved.error!, onRetry: state.loadSaved)
            else if (saved.data.isEmpty)
              const EmptyState(
                icon: Icons.bookmark_add_outlined,
                title: 'Hali hech narsa saqlanmagan',
                message: 'Istalgan vakansiyadagi xatchoʻpni bosing, u shu yerda sizni kutadi.',
              )
            else
              for (var i = 0; i < saved.data.length; i++)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: JobCard(
                    job: saved.data[i],
                    heroScope: 'saved',
                    onTap: () => Navigator.of(context)
                        .push(appRoute(JobDetailScreen(jobId: saved.data[i].id, heroScope: 'saved'))),
                    onToggleSave: () async {
                      try {
                        await state.toggleSaved(saved.data[i]);
                      } catch (_) {
                        if (context.mounted) showToast(context, 'Saqlanganlarni yangilab boʻlmadi', error: true, lifted: true);
                      }
                    },
                  ).animate(delay: (40 * (i < 8 ? i : 8)).ms).fadeIn(duration: 350.ms).slideY(begin: 0.06),
                ),
          ],
        ),
      ),
    );
  }
}
