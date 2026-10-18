// Offline sanity check for the Dart sources (no Flutter SDK needed):
//  - bracket balance (comments/strings stripped)
//  - relative imports resolve
//  - `import 'x.dart' show A` names exist
//  - project classes referenced as Foo( / Foo. are defined somewhere
// It is NOT a compiler. Run `flutter analyze` for the real thing.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'

const root = new URL('../lib', import.meta.url).pathname
const files = []
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : p.endsWith('.dart') && files.push(p) } }
walk(root)

function strip(src) {
  let out = '', i = 0
  while (i < src.length) {
    const c = src[i], n = src[i + 1]
    if (c === '/' && n === '/') { while (i < src.length && src[i] !== '\n') i++; continue }
    if (c === '/' && n === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue }
    if (c === "'" || c === '"') {
      const triple = src.startsWith(c.repeat(3), i)
      const raw = src[i - 1] === 'r'
      const q = triple ? c.repeat(3) : c
      i += q.length
      let interp = ''
      while (i < src.length && !src.startsWith(q, i)) {
        if (src[i] === '\\' && !raw) { i += 2; continue }
        if (src[i] === '$' && src[i + 1] === '{' && !raw) {
          let d = 1; i += 2; let s = i
          while (i < src.length && d) { if (src[i] === '{') d++; else if (src[i] === '}') d--; i++ }
          interp += ' ' + strip(src.slice(s, i - 1)) + ' '
          continue
        }
        i++
      }
      i += q.length
      out += '""' + interp
      continue
    }
    out += c; i++
  }
  return out
}

const defined = new Set()
const texts = new Map()
for (const f of files) {
  const t = readFileSync(f, 'utf8'); texts.set(f, t)
  for (const m of t.matchAll(/^(?:abstract\s+|sealed\s+|final\s+|base\s+)*(?:class|enum|mixin|typedef|extension)\s+([A-Za-z_]\w*)/gm)) defined.add(m[1])
}

const known = new Set(`Color Colors Icons Icon IconData Text TextStyle Widget State StatefulWidget StatelessWidget BuildContext Key Scaffold AppBar Column Row Stack Positioned Expanded Padding Container SizedBox Center Align Spacer Wrap ListView CustomScrollView SliverList SliverToBoxAdapter SliverPadding SliverSafeArea SafeArea SingleChildScrollView ConstrainedBox RefreshIndicator TextField InputDecoration IconButton TextButton PopupMenuButton PopupMenuItem AlertDialog Divider ListTile Form GlobalKey Theme ThemeData ColorScheme Navigator MaterialApp Material InkWell GestureDetector Semantics AnimatedContainer AnimatedSwitcher KeyedSubtree ValueKey AnimationController CurvedAnimation Curves Cubic ScaleTransition FadeTransition SlideTransition Tween TweenAnimationBuilder AnimatedBuilder Opacity Transform Offset Size Duration BoxDecoration BoxShadow Border BorderSide BorderRadius Radius EdgeInsets Alignment LinearGradient SweepGradient RadialGradient GradientRotation BoxConstraints BoxShape TextDecoration FontWeight TextAlign TextOverflow TextInputAction TextInputType TextEditingController FocusScope PageController PageView PageRouteBuilder PopScope SegmentedButton ButtonSegment CalendarDatePicker CircularProgressIndicator RoundedRectangleBorder SnackBar SnackBarBehavior ScaffoldMessenger MediaQuery ClipRRect ClipOval Image Listenable ChangeNotifier InheritedNotifier ValueNotifier Future Timer List Map Set DateTime DateFormat RegExp Uri Exception String Object Cubic CustomPainter CustomPaint Canvas Paint Path Rect RRect Shader Matrix4 ImageFilter BackdropFilter SystemChrome Clipboard ClipboardData HapticFeedback AutofillHints TextInputFormatter FilePicker FileType PlatformFile SharedPreferences GoogleFonts Animate Intrinsic IntrinsicHeight Route PreferredSize StatefulBuilder LayoutBuilder SliverChildListDelegate Brightness VisualDensity Ticker TickerProvider SingleTickerProviderStateMixin MultipartRequest MultipartFile Response Client AnimateList Interval AlwaysScrollableScrollPhysics BouncingScrollPhysics DecoratedBox ColoredBox Flexible FittedBox Visibility IgnorePointer AbsorbPointer MouseRegion Listener Scrollable ScrollController Overlay OverlayEntry TextSpan Text InlineSpan DefaultTextStyle Placeholder RichText TextPainter TextDirection TextSpan TextStyle ImageFiltered Badge FloatingActionButton ElevatedButton OutlinedButton FilledButton CircleAvatar Chip ChoiceChip ActionChip Card Drawer BottomSheet showModalBottomSheet showDialog Dismissible Hero ListBody SliverAppBar SliverFillRemaining SliverGrid SliverGridDelegateWithFixedCrossAxisCount GridView DateTimeRange TimeOfDay NumberFormat Platform Directory File Stopwatch Random Duration StackTrace Error ArgumentError StateError FormatException Iterable Iterator Comparable Function Type Null Never void bool int double num dynamic Record Symbol Enum BigInt Stream StreamController Completer Isolate Shadow WidgetsFlutterBinding CrossAxisAlignment MainAxisAlignment MainAxisSize Axis IndexedStack NoSplash ProgressIndicatorThemeData TextSelectionThemeData HSLColor OutlineInputBorder TextFormField StackFit RepaintBoundary BoxFit AnimatedScale AnimatedOpacity HitTestBehavior AnimatedPositioned Clip PaintingStyle StrokeCap Locale GlobalMaterialLocalizations`.split(/\s+/))

let problems = 0
const bad = (f, msg) => { problems++; console.log(`✗ ${f.replace(root + '/', '')}: ${msg}`) }

for (const f of files) {
  const raw = texts.get(f), s = strip(raw)
  const stack = [], pairs = { ')': '(', ']': '[', '}': '{' }
  let line = 1, broke = false
  for (const ch of s) {
    if (ch === '\n') line++
    if ('([{'.includes(ch)) stack.push([ch, line])
    else if (')]}'.includes(ch)) {
      const top = stack.pop()
      if (!top || top[0] !== pairs[ch]) { bad(f, `unbalanced '${ch}' near line ${line}`); broke = true; break }
    }
  }
  if (!broke && stack.length) bad(f, `unclosed '${stack.at(-1)[0]}' opened near line ${stack.at(-1)[1]}`)

  for (const m of raw.matchAll(/^\s*import\s+'([^']+)'(?:\s+show\s+([^;]+))?;/gm)) {
    const spec = m[1]
    if (spec.startsWith('package:') || spec.startsWith('dart:')) {
      if (spec.startsWith('package:ilmgo/')) bad(f, `self-package import ${spec} (use relative)`)
      continue
    }
    const target = resolve(dirname(f), spec)
    if (!existsSync(target)) { bad(f, `import not found: ${spec}`); continue }
    if (m[2]) {
      const tt = texts.get(target) || ''
      for (const name of m[2].split(',').map((x) => x.trim())) if (name && !new RegExp(`\\b${name}\\b`).test(tt)) bad(f, `'${name}' not found in ${spec}`)
    }
  }

  const localOnly = new Set()
  for (const m of s.matchAll(/\b([A-Z][A-Za-z0-9_]*)\s*(?:\(|\.(?=[a-z]))/g)) {
    const n = m[1]
    if (!defined.has(n) && !known.has(n) && !/^[A-Z][A-Z0-9_]*$/.test(n)) localOnly.add(n)
  }
  for (const n of localOnly) bad(f, `unknown identifier '${n}' (not defined in lib/ and not in the known Flutter list)`)
}

// every screen/widget file must be imported by something (finds dead files)
const importedBy = new Map(files.map((f) => [f, 0]))
for (const f of files) for (const m of texts.get(f).matchAll(/import\s+'((?!package:|dart:)[^']+)'/g)) { const t = resolve(dirname(f), m[1]); if (importedBy.has(t)) importedBy.set(t, importedBy.get(t) + 1) }
for (const [f, n] of importedBy) if (!n && !f.endsWith('/main.dart')) console.log(`! unused file: ${f.replace(root + '/', '')}`)

console.log(problems ? `\n${problems} problem(s) in ${files.length} files` : `✓ ${files.length} Dart files: brackets balanced, imports resolve, identifiers known`)
process.exit(problems ? 1 : 0)
