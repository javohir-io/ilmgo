import 'json.dart';

class AppNotification {
  final String id;
  final String type;
  final String title;
  final String body;
  final String? linkKind; // application | interview | job | null
  final String? linkId;
  final DateTime? readAt;
  final DateTime? createdAt;

  const AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    this.linkKind,
    this.linkId,
    this.readAt,
    this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> j) {
    final link = asMap(j['link']);
    return AppNotification(
      id: str(j['id']),
      type: str(j['type']),
      title: str(j['title']),
      body: str(j['body']),
      linkKind: link['kind'] == null ? null : str(link['kind']),
      linkId: link['id'] == null ? null : str(link['id']),
      readAt: dateOrNull(j['readAt']),
      createdAt: dateOrNull(j['createdAt']),
    );
  }

  bool get isRead => readAt != null;

  AppNotification markRead() => AppNotification(
        id: id,
        type: type,
        title: title,
        body: body,
        linkKind: linkKind,
        linkId: linkId,
        readAt: readAt ?? DateTime.now(),
        createdAt: createdAt,
      );
}
