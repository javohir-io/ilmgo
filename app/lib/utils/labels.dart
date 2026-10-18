/// Display labels for server enums. The API always sends English values;
/// the UI shows Uzbek. Unknown values fall through unchanged.
const _type = {
  'Internship': 'Stajirovka',
  'Part-time': 'Yarim stavka',
  'Full-time': 'Toʻliq stavka',
  'Co-op': 'Co-op dasturi',
};
const _workMode = {'Remote': 'Masofaviy', 'Hybrid': 'Gibrid', 'On-site': 'Ofisda'};
const _level = {'Entry': 'Boshlangʻich', 'Junior': 'Junior', 'Mid': 'Middle'};
const _skill = {
  'Beginner': 'Boshlangʻich',
  'Intermediate': 'Oʻrta',
  'Advanced': 'Yuqori',
};

String typeLabel(String v) => _type[v] ?? v;
String workModeLabel(String v) => _workMode[v] ?? v;
String levelLabel(String v) => _level[v] ?? v;
String skillLevelLabel(String v) => _skill[v] ?? v;
