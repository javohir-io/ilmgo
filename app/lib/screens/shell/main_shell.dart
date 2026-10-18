import 'package:flutter/material.dart';

import '../../state/app_state.dart';
import '../../widgets/glass_nav.dart';
import '../discover/discover_screen.dart';
import '../discover/saved_screen.dart';
import '../inbox/inbox_screen.dart';
import '../pipeline/pipeline_screen.dart';
import '../profile/profile_screen.dart';

/// Five tabs kept alive in an IndexedStack, with the floating glass nav on top.
class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;

  void goTo(int i) => setState(() => _index = i);

  @override
  Widget build(BuildContext context) {
    final state = AppStateScope.of(context);
    final items = [
      const NavItem(Icons.explore_outlined, Icons.explore_rounded, 'Vakansiyalar'),
      const NavItem(Icons.bookmark_border_rounded, Icons.bookmark_rounded, 'Saqlangan'),
      const NavItem(Icons.route_outlined, Icons.route_rounded, 'Arizalar'),
      NavItem(Icons.notifications_none_rounded, Icons.notifications_rounded, 'Xabarlar',
          badge: state.unread),
      const NavItem(Icons.person_outline_rounded, Icons.person_rounded, 'Profil'),
    ];
    return PopScope(
      canPop: _index == 0,
      onPopInvoked: (didPop) {
        if (!didPop) goTo(0);
      },
      child: Scaffold(
        extendBody: true,
        body: Stack(
          children: [
            IndexedStack(
              index: _index,
              children: [
                DiscoverScreen(onOpenTab: goTo),
                const SavedScreen(),
                const PipelineScreen(),
                const InboxScreen(),
                ProfileScreen(onOpenTab: goTo),
              ],
            ),
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: GlassNav(items: items, index: _index, onChanged: goTo),
            ),
          ],
        ),
      ),
    );
  }
}
