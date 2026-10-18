import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../models/notification.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../utils/format.dart';
import '../../utils/routes.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/states.dart';
import '../interviews/interview_confirmation_screen.dart';
import '../jobs/job_detail_screen.dart';
import '../pipeline/application_detail_screen.dart';

class InboxScreen extends StatelessWidget {
  const InboxScreen({super.key});

  IconData _icon(String type) {
    if (type.contains('interview')) return Icons.event_available_rounded;
    if (type.contains('offer')) return Icons.workspace_premium_rounded;
    if (type.contains('status') || type.contains('application')) return Icons.route_rounded;
    return Icons.notifications_rounded;
  }

  void _open(BuildContext context, AppState state, AppNotification n) {
    state.markNotificationRead(n);
    final id = n.linkId;
    if (id == null) return;
    final nav = Navigator.of(context);
    switch (n.linkKind) {
      case 'application':
        nav.push(appRoute(ApplicationDetailScreen(applicationId: id)));
        break;
      case 'job':
        nav.push(appRoute(JobDetailScreen(jobId: id, heroScope: 'inbox')));
        break;
      case 'interview':
        for (final i in state.interviews.data) {
          if (i.id == id) {
            nav.push(appRoute(InterviewConfirmationScreen(interview: i, fresh: false)));
            return;
          }
        }
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateScope.of(context);
    final load = state.notifications;
    return SafeArea(
      bottom: false,
      child: RefreshIndicator(
        color: AppColors.sky,
        backgroundColor: AppColors.bgRaised,
        onRefresh: state.loadNotifications,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(AppLayout.gutter, 16, AppLayout.gutter, AppLayout.navClearance),
          children: [
            Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Expanded(child: Text('Xabarlar', style: AppText.display(32))),
              if (state.unread > 0)
                TextButton(
                  onPressed: state.markAllNotificationsRead,
                  child: Text('Mark all read',
                      style: AppText.inter(13.5, weight: FontWeight.w600, color: AppColors.sky)),
                ),
            ]),
            const SizedBox(height: 4),
            Text(state.unread > 0 ? '${state.unread} ta oʻqilmagan' : 'Hammasi oʻqilgan.', style: AppText.bodyMuted),
            const SizedBox(height: 18),
            if (load.error != null && load.data.isEmpty)
              ErrorState(message: load.error!, onRetry: state.loadNotifications)
            else if (load.data.isEmpty)
              const EmptyState(
                icon: Icons.notifications_none_rounded,
                title: 'Bildirishnomalar yoʻq',
                message: 'Holat oʻzgarishlari va intervyu eslatmalari shu yerda paydo boʻladi.',
              )
            else
              for (var i = 0; i < load.data.length; i++)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: GlassCard(
                    onTap: () => _open(context, state, load.data[i]),
                    padding: const EdgeInsets.all(14),
                    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          borderRadius: AppRadii.smR,
                          color: AppColors.azure.withOpacity(load.data[i].isRead ? 0.1 : 0.25),
                        ),
                        child: Icon(_icon(load.data[i].type),
                            size: 20, color: load.data[i].isRead ? AppColors.muted : AppColors.text),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(load.data[i].title,
                              style: AppText.inter(14.5,
                                  weight: load.data[i].isRead ? FontWeight.w500 : FontWeight.w700)),
                          if (load.data[i].body.isNotEmpty) ...[
                            const SizedBox(height: 2),
                            Text(load.data[i].body, style: AppText.bodyMuted),
                          ],
                          const SizedBox(height: 4),
                          Text(relativeTime(load.data[i].createdAt), style: AppText.caption),
                        ]),
                      ),
                      if (!load.data[i].isRead)
                        Container(
                          margin: const EdgeInsets.only(top: 6, left: 8),
                          width: 9,
                          height: 9,
                          decoration: const BoxDecoration(shape: BoxShape.circle, color: AppColors.mist),
                        ),
                    ]),
                  ).animate(delay: (30 * (i < 10 ? i : 10)).ms).fadeIn(duration: 300.ms).slideY(begin: 0.05),
                ),
          ],
        ),
      ),
    );
  }
}
