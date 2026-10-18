import 'json.dart';

/// The signed-in student (`User` in docs/API.md).
class AppUser {
  final String id;
  final String name;
  final String email;
  final String role;
  final String university;
  final String degreeProgram;
  final int? graduationYear;
  final String phone;
  final String about;
  final String title;
  final List<String> skills;
  final String githubUrl;
  final String linkedinUrl;
  final String? profilePhotoUrl;
  final int profileCompleteness;

  const AppUser({
    required this.id,
    required this.name,
    required this.email,
    this.role = 'student',
    this.university = '',
    this.degreeProgram = '',
    this.graduationYear,
    this.phone = '',
    this.about = '',
    this.title = 'Talaba',
    this.skills = const [],
    this.githubUrl = '',
    this.linkedinUrl = '',
    this.profilePhotoUrl,
    this.profileCompleteness = 0,
  });

  factory AppUser.fromJson(Map<String, dynamic> j) {
    return AppUser(
      id: str(j['id']),
      name: str(j['name']),
      email: str(j['email']),
      role: str(j['role'], 'student'),
      university: str(j['university']),
      degreeProgram: str(j['degreeProgram']),
      graduationYear:
          j['graduationYear'] == null ? null : intOr(j['graduationYear']),
      phone: str(j['phone']),
      about: str(j['about']),
      title: str(j['title'], 'Talaba'),
      skills: strList(j['skills']),
      githubUrl: str(j['githubUrl']),
      linkedinUrl: str(j['linkedinUrl']),
      profilePhotoUrl:
          j['profilePhotoUrl'] == null ? null : str(j['profilePhotoUrl']),
      profileCompleteness: intOr(j['profileCompleteness']),
    );
  }

  String get firstName {
    final p = name.trim().split(RegExp(r'\s+'));
    return p.isEmpty || p.first.isEmpty ? 'there' : p.first;
  }
}
