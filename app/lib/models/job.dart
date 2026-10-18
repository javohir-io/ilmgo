import 'json.dart';

/// A job / internship posting (`Job` in docs/API.md). Personalised fields
/// (matchScore, matchedSkills, isSaved, applicationStatus) are only present
/// when the request carried a token.
class Job {
  final String id;
  final String title;
  final String company;
  final String location;
  final String type;
  final String workMode;
  final String level;
  final String stipend;
  final DateTime? deadline;
  final bool isOpen;
  final bool featured;
  final String accent;
  final List<String> skills;
  final String description;
  final List<String> requirements;
  final List<String> benefits;
  final String companyAbout;
  final String? imageUrl;
  final int? matchScore;
  final List<String> matchedSkills;
  final bool isSaved;
  final String? applicationStatus;

  const Job({
    required this.id,
    required this.title,
    required this.company,
    required this.location,
    this.type = 'Internship',
    this.workMode = 'On-site',
    this.level = 'Entry',
    this.stipend = '',
    this.deadline,
    this.isOpen = true,
    this.featured = false,
    this.accent = '#00638E',
    this.skills = const [],
    this.description = '',
    this.requirements = const [],
    this.benefits = const [],
    this.companyAbout = '',
    this.imageUrl,
    this.matchScore,
    this.matchedSkills = const [],
    this.isSaved = false,
    this.applicationStatus,
  });

  factory Job.fromJson(Map<String, dynamic> j, {bool? isSaved}) {
    final score = j['matchScore'];
    return Job(
      id: str(j['id']),
      title: str(j['title']),
      company: str(j['company']),
      location: str(j['location']),
      type: str(j['type'], 'Internship'),
      workMode: str(j['workMode'], 'On-site'),
      level: str(j['level'], 'Entry'),
      stipend: str(j['stipend']),
      deadline: dateOrNull(j['deadline']),
      isOpen: str(j['status'], 'open') != 'closed',
      featured: boolOr(j['featured']),
      accent: str(j['accent'], '#00638E'),
      skills: strList(j['skills']),
      description: str(j['description']),
      requirements: strList(j['requirements']),
      benefits: strList(j['benefits']),
      companyAbout: str(j['companyAbout']),
      imageUrl: j['imageUrl'] == null ? null : str(j['imageUrl']),
      matchScore: score == null ? null : intOr(score),
      matchedSkills: strList(j['matchedSkills']),
      isSaved: isSaved ?? boolOr(j['isSaved']),
      applicationStatus:
          j['applicationStatus'] == null ? null : str(j['applicationStatus']),
    );
  }

  bool get hasApplied => applicationStatus != null;

  /// Skills the job asks for that the student has not listed yet.
  List<String> get missingSkills {
    final have = matchedSkills.map((s) => s.toLowerCase()).toSet();
    return skills.where((s) => !have.contains(s.toLowerCase())).toList();
  }

  Job copyWith({bool? isSaved, String? applicationStatus}) => Job(
        id: id,
        title: title,
        company: company,
        location: location,
        type: type,
        workMode: workMode,
        level: level,
        stipend: stipend,
        deadline: deadline,
        isOpen: isOpen,
        featured: featured,
        accent: accent,
        skills: skills,
        description: description,
        requirements: requirements,
        benefits: benefits,
        companyAbout: companyAbout,
        imageUrl: imageUrl,
        matchScore: matchScore,
        matchedSkills: matchedSkills,
        isSaved: isSaved ?? this.isSaved,
        applicationStatus: applicationStatus ?? this.applicationStatus,
      );
}

/// Subset of a job embedded in applications and interviews.
class JobRef {
  final String id;
  final String title;
  final String company;
  final String accent;
  final String location;
  final String type;

  const JobRef({
    required this.id,
    required this.title,
    required this.company,
    this.accent = '#00638E',
    this.location = '',
    this.type = '',
  });

  factory JobRef.fromJson(dynamic raw) {
    final j = asMap(raw);
    return JobRef(
      id: str(j['id']),
      title: str(j['title']),
      company: str(j['company']),
      accent: str(j['accent'], '#00638E'),
      location: str(j['location']),
      type: str(j['type']),
    );
  }
}
