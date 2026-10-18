import '../models/json.dart';
import '../models/notification.dart';
import 'api_client.dart';

class NotificationPage {
  final List<AppNotification> items;
  final int unread;
  const NotificationPage(this.items, this.unread);
}

class NotificationService {
  NotificationService._();
  static final instance = NotificationService._();
  final _client = ApiClient.instance;

  Future<NotificationPage> fetch() async {
    final data = await _client.get('/api/notifications');
    return NotificationPage(
      mapList(data['notifications']).map(AppNotification.fromJson).toList(),
      intOr(data['unread']),
    );
  }

  Future<int> markRead(String id) async {
    final data = await _client.post('/api/notifications/$id/read');
    return intOr(data['unread']);
  }

  Future<void> markAllRead() => _client.post('/api/notifications/read-all');
}
