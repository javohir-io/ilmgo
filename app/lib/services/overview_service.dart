import '../models/json.dart';
import '../models/overview.dart';
import 'api_client.dart';

class OverviewService {
  OverviewService._();
  static final instance = OverviewService._();

  Future<Overview> fetch() async {
    final data = await ApiClient.instance.get('/api/me/overview');
    return Overview.fromJson(asMap(data));
  }
}
