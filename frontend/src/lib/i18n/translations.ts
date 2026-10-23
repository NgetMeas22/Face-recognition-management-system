export type Locale = "en" | "km";

export interface Translations {
  common: {
    appName: string;
    tagline: string;
    loading: string;
    online: string;
    offline: string;
    connected: string;
    unavailable: string;
    search: string;
    filter: string;
    clear: string;
    save: string;
    cancel: string;
    discard: string;
    delete: string;
    edit: string;
    actions: string;
    details: string;
    status: string;
    date: string;
    time: string;
    type: string;
    role: string;
    name: string;
    id: string;
    code: string;
    email: string;
    username: string;
    active: string;
    inactive: string;
    archived: string;
    yes: string;
    no: string;
    soon: string;
    refresh: string;
    retry: string;
    close: string;
    back: string;
    submit: string;
    optional: string;
    required: string;
    all: string;
    none: string;
    exportCsv: string;
    exportExcel: string;
    noData: string;
  };
  nav: {
    overview: string;
    people: string;
    recognition: string;
    attendance: string;
    system: string;
    dashboard: string;
    employees: string;
    departments: string;
    faces: string;
    scanner: string;
    scans: string;
    reports: string;
    settings: string;
    users: string;
  };
  auth: {
    signIn: string;
    signInTitle: string;
    signInSubtitle: string;
    enterCredentials: string;
    usernameOrEmail: string;
    password: string;
    signingIn: string;
    signOut: string;
    signedInAs: string;
    sessionExpired: string;
    passwordChanged: string;
    signInFailed: string;
    showPassword: string;
    hidePassword: string;
    usernameRequired: string;
    passwordRequired: string;
    passwordTooLong: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    greetingMorning: string;
    greetingAfternoon: string;
    greetingEvening: string;
    employees: string;
    presentToday: string;
    absentToday: string;
    scansToday: string;
    apiStatus: string;
    database: string;
    yourRole: string;
    yourPermissions: string;
    permissionsPerRole: string;
    yourAccess: string;
    recentActivity: string;
    noActivity: string;
    openScanner: string;
    systemHealth: string;
    upToDate: string;
  };
  people: {
    title: string;
    subtitle: string;
    addPerson: string;
    searchPlaceholder: string;
    emptyPeople: string;
    colId: string;
    colName: string;
    colType: string;
    colDepartment: string;
    colPosition: string;
    colStatus: string;
    employeeAdded: string;
    employee: string;
    student: string;
  };
  departments: {
    title: string;
    subtitle: string;
    addDepartment: string;
    searchPlaceholder: string;
    emptyDepartments: string;
    colCode: string;
    colName: string;
    colKhmerName: string;
    colKind: string;
    colActive: string;
    kindDepartment: string;
    kindClass: string;
  };
  faces: {
    title: string;
    subtitle: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    selectPerson: string;
    consentConfirmed: string;
    consentNotice: string;
    capturePhotos: string;
    submitApproval: string;
    collectedImages: string;
    tipsTitle: string;
    tip1: string;
    tip2: string;
    tip3: string;
    tip4: string;
    addFrame: string;
    clearAll: string;
  };
  scanner: {
    title: string;
    subtitle: string;
    liveCamera: string;
    uploadImage: string;
    cameraPrompt: string;
    uploadPrompt: string;
    identify: string;
    scanImage: string;
    snapshot: string;
    resultTitle: string;
    match: string;
    matchDesc: string;
    needsReview: string;
    needsReviewDesc: string;
    noMatch: string;
    noMatchDesc: string;
    manualVerify: string;
    manualVerifySuccess: string;
    similarityScore: string;
    matchedPerson: string;
    privacyNotice: string;
    readyToScan: string;
  };
  attendance: {
    title: string;
    subtitle: string;
    manualCheckIn: string;
    export: string;
    searchPlaceholder: string;
    emptyAttendance: string;
    colTime: string;
    colPerson: string;
    colEvent: string;
    colMethod: string;
    colPunctuality: string;
    checkIn: string;
    checkOut: string;
    onTime: string;
    late: string;
  };
  scans: {
    title: string;
    subtitle: string;
    emptyScans: string;
    colTime: string;
    colMode: string;
    colOutcome: string;
    colScore: string;
    colPerson: string;
    colOperator: string;
    modeLive: string;
    modeUpload: string;
  };
  reports: {
    title: string;
    subtitle: string;
    cardSummaryTitle: string;
    cardSummaryDesc: string;
    cardTrendTitle: string;
    cardTrendDesc: string;
    cardOutcomesTitle: string;
    cardOutcomesDesc: string;
    exportCsv: string;
    exportExcel: string;
    noDataReport: string;
  };
  settings: {
    title: string;
    subtitle: string;
    tabAccount: string;
    tabGeneral: string;
    tabUsers: string;
    tabSystem: string;
    appearance: string;
    appearanceDesc: string;
    themeLight: string;
    themeDark: string;
    themeSystem: string;
    language: string;
    languageDesc: string;
    accountTitle: string;
    accountDesc: string;
    fullName: string;
    changePasswordTitle: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    updatePassword: string;
    passwordChanged: string;
    rolesTitle: string;
    rolesDesc: string;
    filterPermissions: string;
    systemTitle: string;
    systemDesc: string;
    apiLabel: string;
    databaseLabel: string;
    schemaLabel: string;
    userManagementTitle: string;
    userManagementDesc: string;
  };
}

export const translations: Record<Locale, Translations> = {
  en: {
    common: {
      appName: "FaceTrack AI",
      tagline: "Biometric Management",
      loading: "Loading…",
      online: "Online",
      offline: "Offline",
      connected: "Connected",
      unavailable: "Unavailable",
      search: "Search",
      filter: "Filter",
      clear: "Clear",
      save: "Save",
      cancel: "Cancel",
      discard: "Discard",
      delete: "Delete",
      edit: "Edit",
      actions: "Actions",
      details: "Details",
      status: "Status",
      date: "Date",
      time: "Time",
      type: "Type",
      role: "Role",
      name: "Name",
      id: "ID",
      code: "Code",
      email: "Email",
      username: "Username",
      active: "Active",
      inactive: "Inactive",
      archived: "Archived",
      yes: "Yes",
      no: "No",
      soon: "Soon",
      refresh: "Refresh",
      retry: "Retry",
      close: "Close",
      back: "Back",
      submit: "Submit",
      optional: "Optional",
      required: "Required",
      all: "All",
      none: "None",
      exportCsv: "Export CSV",
      exportExcel: "Export Excel",
      noData: "No records found",
    },
    nav: {
      overview: "Overview",
      people: "People",
      recognition: "Recognition",
      attendance: "Attendance",
      system: "System",
      dashboard: "Dashboard",
      employees: "Employees",
      departments: "Departments",
      faces: "Registration",
      scanner: "Scanner",
      scans: "Scan History",
      reports: "Reports",
      settings: "Settings",
      users: "User Management",
    },
    auth: {
      signIn: "Sign in",
      signInTitle: "FaceTrack AI",
      signInSubtitle: "Enter your credentials",
      enterCredentials: "Enter your credentials",
      usernameOrEmail: "Username or email",
      password: "Password",
      signingIn: "Signing in…",
      signOut: "Sign out",
      signedInAs: "Signed in as",
      sessionExpired: "Session expired. Sign in again.",
      passwordChanged: "Password changed. Sign in again.",
      signInFailed: "Sign-in failed",
      showPassword: "Show password",
      hidePassword: "Hide password",
      usernameRequired: "Enter username or email.",
      passwordRequired: "Enter password.",
      passwordTooLong: "Password is too long.",
    },
    dashboard: {
      title: "Dashboard",
      subtitle: "Daily overview and system telemetry.",
      greetingMorning: "Good morning",
      greetingAfternoon: "Good afternoon",
      greetingEvening: "Good evening",
      employees: "Employees",
      presentToday: "Present Today",
      absentToday: "Absent Today",
      scansToday: "Scans Today",
      apiStatus: "API Service",
      database: "Database",
      yourRole: "Your Role",
      yourPermissions: "Permissions",
      permissionsPerRole: "Permissions per role",
      yourAccess: "Your Access",
      recentActivity: "Recent Activity",
      noActivity: "No scans recorded today.",
      openScanner: "Open Scanner",
      systemHealth: "System Status",
      upToDate: "Up to date",
    },
    people: {
      title: "Employees",
      subtitle: "Manage personnel records.",
      addPerson: "Add Employee",
      searchPlaceholder: "Search by name or ID…",
      emptyPeople: "No employees found.",
      colId: "ID",
      colName: "Name",
      colType: "Type",
      colDepartment: "Department",
      colPosition: "Position",
      colStatus: "Status",
      employeeAdded: "Employee added",
      employee: "Employee",
      student: "Student",
    },
    departments: {
      title: "Departments",
      subtitle: "Manage departments and classes.",
      addDepartment: "Add Department",
      searchPlaceholder: "Search departments…",
      emptyDepartments: "No departments found.",
      colCode: "Code",
      colName: "Name",
      colKhmerName: "Khmer Name",
      colKind: "Type",
      colActive: "Active",
      kindDepartment: "Department",
      kindClass: "Class",
    },
    faces: {
      title: "Face Registration",
      subtitle: "Enroll face profiles with consent.",
      step1: "Select Person",
      step2: "Consent",
      step3: "Photos",
      step4: "Submit",
      selectPerson: "Choose a person",
      consentConfirmed: "Consent confirmed",
      consentNotice: "Biometric consent is recorded.",
      capturePhotos: "Capture or upload 3–5 photos",
      submitApproval: "Submit for Approval",
      collectedImages: "Collected Photos",
      tipsTitle: "Guidelines",
      tip1: "Front-facing with neutral expression",
      tip2: "Clear lighting, no strong shadows",
      tip3: "Slight left/right angles included",
      tip4: "Face uncovered; remove tinted glasses",
      addFrame: "Add Frame",
      clearAll: "Clear",
    },
    scanner: {
      title: "Face Scanner",
      subtitle: "Real-time recognition.",
      liveCamera: "Live Camera",
      uploadImage: "Upload Photo",
      cameraPrompt: "Position face in the center frame.",
      uploadPrompt: "Drop image file here.",
      identify: "Scan Face",
      scanImage: "Scan Photo",
      snapshot: "Captured Frame",
      resultTitle: "Result",
      match: "Match Confirmed",
      matchDesc: "Identity verified with high confidence.",
      needsReview: "Needs Review",
      needsReviewDesc: "Uncertain match. Manual verification needed.",
      noMatch: "Unknown Face",
      noMatchDesc: "No match found.",
      manualVerify: "Verify Manually",
      manualVerifySuccess: "Manual verification confirmed.",
      similarityScore: "Similarity Score",
      matchedPerson: "Identified Person",
      privacyNotice: "Personal data is hidden for unknown faces.",
      readyToScan: "Ready to scan.",
    },
    attendance: {
      title: "Attendance",
      subtitle: "Daily check-in and check-out logs.",
      manualCheckIn: "Manual Check-in",
      export: "Export",
      searchPlaceholder: "Search attendance…",
      emptyAttendance: "No attendance records found.",
      colTime: "Time",
      colPerson: "Person",
      colEvent: "Event",
      colMethod: "Method",
      colPunctuality: "Punctuality",
      checkIn: "Check In",
      checkOut: "Check Out",
      onTime: "On Time",
      late: "Late",
    },
    scans: {
      title: "Scan History",
      subtitle: "Recent recognition logs.",
      emptyScans: "No scan events recorded yet.",
      colTime: "Time",
      colMode: "Mode",
      colOutcome: "Outcome",
      colScore: "Score",
      colPerson: "Matched Person",
      colOperator: "Operator",
      modeLive: "Live",
      modeUpload: "Upload",
    },
    reports: {
      title: "Reports",
      subtitle: "Attendance and scan summaries.",
      cardSummaryTitle: "Attendance Summary",
      cardSummaryDesc: "Daily counts of present and late arrivals.",
      cardTrendTitle: "Punctuality Trend",
      cardTrendDesc: "Weekly attendance curves.",
      cardOutcomesTitle: "Scan Outcomes",
      cardOutcomesDesc: "Matches, reviews, and unknown faces.",
      exportCsv: "Export CSV",
      exportExcel: "Export Excel",
      noDataReport: "No data available yet.",
    },
    settings: {
      title: "Settings",
      subtitle: "System preferences and account security.",
      tabAccount: "Account",
      tabGeneral: "Preferences",
      tabUsers: "User Management",
      tabSystem: "System Status",
      appearance: "Appearance",
      appearanceDesc: "Interface theme.",
      themeLight: "Light",
      themeDark: "Dark",
      themeSystem: "System",
      language: "Language",
      languageDesc: "Display language.",
      accountTitle: "Account Details",
      accountDesc: "Operator credentials.",
      fullName: "Full Name",
      changePasswordTitle: "Change Password",
      currentPassword: "Current password",
      newPassword: "New password",
      confirmPassword: "Confirm new password",
      updatePassword: "Save Password",
      passwordChanged: "Password changed successfully.",
      rolesTitle: "Role Permissions Matrix",
      rolesDesc: "Permissions assigned to each role.",
      filterPermissions: "Filter permissions…",
      systemTitle: "System & Database",
      systemDesc: "API diagnostic and schema telemetry.",
      apiLabel: "API Service",
      databaseLabel: "Database Engine",
      schemaLabel: "Schema Revision",
      userManagementTitle: "User Management",
      userManagementDesc: "Roles and permissions.",
    },
  },
  km: {
    common: {
      appName: "FaceTrack AI",
      tagline: "ប្រព័ន្ធស្គាល់មុខ និងវត្តមាន",
      loading: "កំពុងផ្ទុក…",
      online: "ដំណើរការ",
      offline: "គ្មានការតភ្ជាប់",
      connected: "បានភ្ជាប់",
      unavailable: "មិនអាចប្រើបាន",
      search: "ស្វែងរក",
      filter: "ច្រោះ",
      clear: "សម្អាត",
      save: "រក្សាទុក",
      cancel: "បោះបង់",
      discard: "លុបចោល",
      delete: "លុប",
      edit: "កែប្រែ",
      actions: "សកម្មភាព",
      details: "ព័ត៌មានលម្អិត",
      status: "ស្ថានភាព",
      date: "កាលបរិច្ឆេទ",
      time: "ពេលវេលា",
      type: "ប្រភេទ",
      role: "តួនាទី",
      name: "ឈ្មោះ",
      id: "អត្តលេខ",
      code: "កូដ",
      email: "អ៊ីមែល",
      username: "ឈ្មោះអ្នកប្រើ",
      active: "សកម្ម",
      inactive: "អសកម្ម",
      archived: "ប័ណ្ណសារ",
      yes: "បាទ/ចាស",
      no: "ទេ",
      soon: "ឆាប់ៗ",
      refresh: "ផ្ទុកឡើងវិញ",
      retry: "ព្យាយាមម្តងទៀត",
      close: "បិទ",
      back: "ត្រឡប់ក្រោយ",
      submit: "បញ្ជូន",
      optional: "ជាជម្រើស",
      required: "ទាមទារ",
      all: "ទាំងអស់",
      none: "គ្មាន",
      exportCsv: "នាំចេញ CSV",
      exportExcel: "នាំចេញ Excel",
      noData: "គ្មានទិន្នន័យ",
    },
    nav: {
      overview: "ទិដ្ឋភាពទូទៅ",
      people: "បុគ្គលិក",
      recognition: "ការស្គាល់មុខ",
      attendance: "វត្តមាន",
      system: "ប្រព័ន្ធ",
      dashboard: "ផ្ទាំងគ្រប់គ្រង",
      employees: "បុគ្គលិក",
      departments: "នាយកដ្ឋាន",
      faces: "ចុះឈ្មោះមុខ",
      scanner: "ម៉ាស៊ីនស្កេន",
      scans: "ប្រវត្តិស្កេន",
      reports: "របាយការណ៍",
      settings: "ការកំណត់",
      users: "គ្រប់គ្រងអ្នកប្រើ",
    },
    auth: {
      signIn: "ចូលប្រើ",
      signInTitle: "FaceTrack AI",
      signInSubtitle: "បញ្ចូលព័ត៌មានសម្ងាត់របស់អ្នក",
      enterCredentials: "បញ្ចូលព័ត៌មានសម្ងាត់របស់អ្នក",
      usernameOrEmail: "ឈ្មោះអ្នកប្រើ ឬអ៊ីមែល",
      password: "ពាក្យសម្ងាត់",
      signingIn: "កំពុងចូល…",
      signOut: "ចាកចេញ",
      signedInAs: "បានចូលជា",
      sessionExpired: "វគ្គបានផុតកំណត់។ សូមចូលម្តងទៀត។",
      passwordChanged: "បានប្តូរពាក្យសម្ងាត់។ សូមចូលម្តងទៀត។",
      signInFailed: "ចូលប្រើមិនជោគជ័យ",
      showPassword: "បង្ហាញពាក្យសម្ងាត់",
      hidePassword: "លាក់ពាក្យសម្ងាត់",
      usernameRequired: "សូមបញ្ចូលឈ្មោះអ្នកប្រើ ឬអ៊ីមែល។",
      passwordRequired: "សូមបញ្ចូលពាក្យសម្ងាត់។",
      passwordTooLong: "ពាក្យសម្ងាត់វែងពេក។",
    },
    dashboard: {
      title: "ផ្ទាំងគ្រប់គ្រង",
      subtitle: "ទិដ្ឋភាពទូទៅប្រចាំថ្ងៃ និងស្ថានភាពប្រព័ន្ធ។",
      greetingMorning: "អរុណសួស្តី",
      greetingAfternoon: "ទិវាសួស្តី",
      greetingEvening: "សាយណ្ហសួស្តី",
      employees: "បុគ្គលិក",
      presentToday: "មានវត្តមានថ្ងៃនេះ",
      absentToday: "អវត្តមានថ្ងៃនេះ",
      scansToday: "ស្កេនថ្ងៃនេះ",
      apiStatus: "សេវា API",
      database: "មូលដ្ឋានទិន្នន័យ",
      yourRole: "តួនាទី",
      yourPermissions: "សិទ្ធិអនុញ្ញាត",
      permissionsPerRole: "សិទ្ធិតាមតួនាទី",
      yourAccess: "សិទ្ធិទទួលបាន",
      recentActivity: "សកម្មភាពថ្មីៗ",
      noActivity: "មិនទាន់មានការស្កេនថ្ងៃនេះទេ។",
      openScanner: "បើកម៉ាស៊ីនស្កេន",
      systemHealth: "សុខភាពប្រព័ន្ធ",
      upToDate: "ទាន់សម័យ",
    },
    people: {
      title: "បុគ្គលិក",
      subtitle: "គ្រប់គ្រងព័ត៌មានបុគ្គលិក។",
      addPerson: "បន្ថែមបុគ្គលិក",
      searchPlaceholder: "ស្វែងរកតាមឈ្មោះ ឬអត្តលេខ…",
      emptyPeople: "រកមិនឃើញបុគ្គលិកទេ។",
      colId: "អត្តលេខ",
      colName: "ឈ្មោះ",
      colType: "ប្រភេទ",
      colDepartment: "នាយកដ្ឋាន",
      colPosition: "មុខតំណែង",
      colStatus: "ស្ថានភាព",
      employeeAdded: "បានបន្ថែមបុគ្គលិកជោគជ័យ",
      employee: "បុគ្គលិក",
      student: "សិស្ស",
    },
    departments: {
      title: "នាយកដ្ឋាន",
      subtitle: "គ្រប់គ្រងនាយកដ្ឋាន និងថ្នាក់។",
      addDepartment: "បន្ថែមនាយកដ្ឋាន",
      searchPlaceholder: "ស្វែងរកនាយកដ្ឋាន…",
      emptyDepartments: "រកមិនឃើញនាយកដ្ឋានទេ។",
      colCode: "កូដ",
      colName: "ឈ្មោះអង់គ្លេស",
      colKhmerName: "ឈ្មោះខ្មែរ",
      colKind: "ប្រភេទ",
      colActive: "សកម្មភាព",
      kindDepartment: "នាយកដ្ឋាន",
      kindClass: "ថ្នាក់រៀន",
    },
    faces: {
      title: "ចុះឈ្មោះផ្ទៃមុខ",
      subtitle: "ចុះឈ្មោះរូបថតផ្ទៃមុខ។",
      step1: "ជ្រើសរើសបុគ្គល",
      step2: "ការយល់ព្រម",
      step3: "រូបថត",
      step4: "បញ្ជូន",
      selectPerson: "ជ្រើសរើសបុគ្គលិក",
      consentConfirmed: "បានបញ្ជាក់ការយល់ព្រម",
      consentNotice: "ការយល់ព្រមជីវមាត្រត្រូវបានកត់ត្រា។",
      capturePhotos: "ថត ឬបង្ហោះរូបថត ៣ ទៅ ៥ សន្លឹក",
      submitApproval: "បញ្ជូនដើម្បីអនុម័ត",
      collectedImages: "រូបថតប្រមូលបាន",
      tipsTitle: "ការណែនាំ",
      tip1: "បែរមុខចំកាមេរ៉ា ដោយទឹកមុខស្មើ",
      tip2: "ពន្លឺច្បាស់ គ្មានស្រមោលខ្លាំង",
      tip3: "ថតជ្រុងឆ្វេង និងស្តាំបន្តិច",
      tip4: "មិនបាំងមុខ ដោះវ៉ែនតាខ្មៅ",
      addFrame: "បន្ថែមរូបថត",
      clearAll: "សម្អាត",
    },
    scanner: {
      title: "ម៉ាស៊ីនស្កេនផ្ទៃមុខ",
      subtitle: "ស្កេនសម្គាល់មុខភ្លាមៗ។",
      liveCamera: "កាមេរ៉ាផ្ទាល់",
      uploadImage: "បង្ហោះរូបភាព",
      cameraPrompt: "សូមដាក់ផ្ទៃមុខចំកណ្តាល។",
      uploadPrompt: "ទម្លាក់រូបភាពនៅទីនេះ។",
      identify: "ស្កេនមុខ",
      scanImage: "ស្កេនរូបភាព",
      snapshot: "រូបថតស្កេន",
      resultTitle: "លទ្ធផល",
      match: "ត្រូវគ្នាយ៉ាងត្រឹមត្រូវ",
      matchDesc: "អត្តសញ្ញាណត្រូវបានផ្ទៀងផ្ទាត់ច្បាស់។",
      needsReview: "ត្រូវការផ្ទៀងផ្ទាត់",
      needsReviewDesc: "ពិន្ទុមិនទាន់ច្បាស់។ ត្រូវការពិនិត្យដោយផ្ទាល់។",
      noMatch: "មិនស្គាល់អត្តសញ្ញាណ",
      noMatchDesc: "រកមិនឃើញប្រវត្តិរូបត្រូវគ្នាទេ។",
      manualVerify: "ផ្ទៀងផ្ទាត់ដោយផ្ទាល់",
      manualVerifySuccess: "បានបញ្ជាក់ការផ្ទៀងផ្ទាត់ជោគជ័យ។",
      similarityScore: "ពិន្ទុភាពដូចគ្នា",
      matchedPerson: "អត្តសញ្ញាណដែលស្គាល់",
      privacyNotice: "ព័ត៌មានផ្ទាល់ខ្លួនត្រូវបានលាក់សម្រាប់ផ្ទៃមុខមិនស្គាល់។",
      readyToScan: "រួចរាល់សម្រាប់ការស្កេន។",
    },
    attendance: {
      title: "វត្តមាន",
      subtitle: "កំណត់ត្រាវត្តមានចូល និងចេញប្រចាំថ្ងៃ។",
      manualCheckIn: "កត់ត្រាដោយផ្ទាល់",
      export: "នាំចេញ",
      searchPlaceholder: "ស្វែងរកវត្តមាន…",
      emptyAttendance: "រកមិនឃើញកំណត់ត្រាវត្តមានទេ។",
      colTime: "ពេលវេលា",
      colPerson: "ឈ្មោះបុគ្គល",
      colEvent: "ព្រឹត្តិការណ៍",
      colMethod: "វិធីសាស្ត្រ",
      colPunctuality: "ការគោរពពេល",
      checkIn: "ចូល",
      checkOut: "ចេញ",
      onTime: "ទាន់ពេល",
      late: "យឺត",
    },
    scans: {
      title: "ប្រវត្តិស្កេន",
      subtitle: "កំណត់ត្រាស្កេនផ្ទៃមុខថ្មីៗ។",
      emptyScans: "មិនទាន់មានកំណត់ត្រាស្កេនទេ។",
      colTime: "ពេលវេលា",
      colMode: "ទម្រង់",
      colOutcome: "លទ្ធផល",
      colScore: "ពិន្ទុ",
      colPerson: "បុគ្គលត្រូវគ្នា",
      colOperator: "អ្នកដំណើរការ",
      modeLive: "កាមេរ៉ា",
      modeUpload: "បង្ហោះ",
    },
    reports: {
      title: "របាយការណ៍",
      subtitle: "សង្ខេបវត្តមាន និងស្ថិតិស្កេន។",
      cardSummaryTitle: "សង្ខេបវត្តមាន",
      cardSummaryDesc: "ចំនួនវត្តមាន និងការមកយឺតប្រចាំថ្ងៃ។",
      cardTrendTitle: "និន្នាការវត្តមាន",
      cardTrendDesc: "ក្រាហ្វិកប្រៀបធៀបវត្តមាន។",
      cardOutcomesTitle: "លទ្ធផលស្កេន",
      cardOutcomesDesc: "របាយការណ៍ស្កេន និងការមិនស្គាល់មុខ។",
      exportCsv: "នាំចេញ CSV",
      exportExcel: "នាំចេញ Excel",
      noDataReport: "មិនទាន់មានទិន្នន័យទេ។",
    },
    settings: {
      title: "ការកំណត់",
      subtitle: "ការកំណត់ប្រព័ន្ធ និងសុវត្ថិភាពគណនី។",
      tabAccount: "គណនី",
      tabGeneral: "ចំណូលចិត្ត",
      tabUsers: "គ្រប់គ្រងអ្នកប្រើ",
      tabSystem: "ស្ថានភាពប្រព័ន្ធ",
      appearance: "រូបរាង",
      appearanceDesc: "ជ្រើសរើសពណ៌ផ្ទៃកម្មវិធី។",
      themeLight: "ពន្លឺ (Light)",
      themeDark: "ងងឹត (Dark)",
      themeSystem: "តាមប្រព័ន្ធ",
      language: "ភាសា",
      languageDesc: "ជ្រើសរើសភាសាបង្ហាញ។",
      accountTitle: "ព័ត៌មានគណនី",
      accountDesc: "ព័ត៌មានអ្នកប្រើប្រាស់។",
      fullName: "ឈ្មោះពេញ",
      changePasswordTitle: "ប្តូរពាក្យសម្ងាត់",
      currentPassword: "ពាក្យសម្ងាត់បច្ចុប្បន្ន",
      newPassword: "ពាក្យសម្ងាត់ថ្មី",
      confirmPassword: "បញ្ជាក់ពាក្យសម្ងាត់ថ្មី",
      updatePassword: "រក្សាទុក",
      passwordChanged: "បានប្តូរពាក្យសម្ងាត់ជោគជ័យ។",
      rolesTitle: "តារាងសិទ្ធិតាមតួនាទី",
      rolesDesc: "សិទ្ធិអនុញ្ញាតតាមតួនាទីនីមួយៗ។",
      filterPermissions: "ស្វែងរកសិទ្ធិ…",
      systemTitle: "ប្រព័ន្ធ និងមូលដ្ឋានទិន្នន័យ",
      systemDesc: "ស្ថានភាពដំណើរការ API និង Schema។",
      apiLabel: "សេវា API",
      databaseLabel: "មូលដ្ឋានទិន្នន័យ",
      schemaLabel: "កំណែទម្រង់ Schema",
      userManagementTitle: "គ្រប់គ្រងអ្នកប្រើប្រាស់",
      userManagementDesc: "តួនាទី និងសិទ្ធិអនុញ្ញាត។",
    },
  },
};
