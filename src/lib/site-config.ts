/* Site nav structure: years → semesters → subjects (+ duas). The source of truth for
   the menu metadata. Per-content counts are NOT here — they are discovered from disk
   (see tools/migrate/discover.ts → src/lib/content/contentIndex.ts). Edit this file to
   add/rename subjects, change emojis/colours/Arabic names, or edit the duas list. */
import type { SiteConfig } from "./content/types";

export const GA_ID = "REDACTED";

export const SITE: SiteConfig = {
  "brand": "🦷 | DentAce",
  "buttons": "neon",
  "duas": [
    "اللهم علِّمنا ما ينفعنا، وانفعنا بما علّمتنا، وزدنا علمًا وعملاً صالحًا.",
    "ربِّ زدني علمًا، واهدني صراطًا مستقيمًا، وبارك لي في وقتي وجهدي.",
    "اللهم افتح علينا أبواب فهمك، وعلّمنا ما ينفعنا، واجعل علمنا سببًا لشفاء عبادك.",
    "ربِّ اجعل هذا العلم نورًا في قلبي، ودليلًا في عملي، وبارك لي في وقتي وتركيزي.",
    "اللهم افتح علينا فتوح العارفين، ويسِّر لنا العلم النافع والعمل الصالح.",
    "اللهم اجعل هذا العلم نورًا في قلوبنا، وبركةً في أوقاتنا، وتوفيقًا في امتحاناتنا.",
    "اللهم ذكّرنا ما نُسّينا، وعلّمنا ما جهلنا، وبارك لنا في الوقت.",
    "اللهم لا سهل إلا ما جعلته سهلًا، وأنت تجعل الحزن إذا شئت سهلًا.",
    "اللهم وفّقنا للصواب، وثبّت قلوبنا، واملأ نفوسنا سكينةً ويقينًا.",
    "اللهم ارزقني فهم النبيين، وحفظ المرسلين، وإلهام الملائكة المقرّبين.",
    "ربِّ اشرح لي صدري، ويسِّر لي أمري، واحلل عقدةً من لساني يفقهوا قولي.",
    "اللهم انفعني بما علّمتني، وعلّمني ما ينفعني، وزدني علمًا.",
    "اللهم إني أسألك علمًا نافعًا، ورزقًا طيّبًا، وعملاً متقبّلًا.",
    "اللهم أخرجني من ظلمات الجهل والوهم إلى أنوار المعرفة والعلم.",
    "اللهم إني أعوذ بك من علمٍ لا ينفع، ومن قلبٍ لا يخشع، ومن نفسٍ لا تشبع.",
    "اللهم يا معلّم آدم علّمني، ويا مفهّم سليمان فهّمني.",
    "اللهم لا تكلني إلى نفسي طرفة عين، وأصلح لي شأني كلَّه.",
    "اللهم اجعل امتحاني يسيرًا، وأعنّي على ما يرضيك.",
    "اللهم ثبّت المعلومة في ذهني، ولا تجعل للنسيان عليها سبيلًا.",
    "اللهم بك أستعين، وعليك أتوكّل، فيسِّر لي ما أنا فيه.",
    "اللهم اجعل ما أحفظه راسخًا في عقلي، حاضرًا عند حاجتي إليه.",
    "اللهم نوِّر بصيرتي، واشرح صدري، ويسِّر أمري.",
    "اللهم اجعلني من أهل العلم العاملين به، الداعين إليك على بصيرة.",
    "ربِّ يسِّر ولا تعسِّر، وتمِّم عليّ بالخير.",
    "اللهم ارزقني الفهم السريع، والحفظ المتين.",
    "اللهم إني استودعتك ما حفظت وما تعلّمت، فاردده إليّ عند حاجتي إليه.",
    "اللهم اجعل أيامي في طلب العلم خيرًا وبركة، وارزقني الإخلاص فيه.",
    "اللهم طهّر قلبي من الغفلة، واملأه بحب العلم والعمل.",
    "اللهم اجعل تعبي في ميزان حسناتي، وعلمي خالصًا لوجهك.",
    "اللهم أعنّي على الصبر والمذاكرة، وارزقني التوفيق والسداد.",
    "اللهم ما جعلته صعبًا فاجعله بفضلك يسيرًا.",
    "اللهم اجعلني ممن يستمعون القول فيتّبعون أحسنه.",
    "اللهم بارك لي في عقلي وحفظي وفهمي، واجعل العلم زينةً لي لا فتنة.",
    "اللهم اهدني وسدّدني، واجعل التوفيق حليفي في كل امتحان.",
    "اللهم اجعل القلق سكينة، والتعب راحة، والمذاكرة فهمًا ونجاحًا.",
    "حسبنا الله ونعم الوكيل، نِعم المولى ونِعم النصير."
  ],
  "years": [
    {
      "id": "3rd",
      "name": "3️⃣rd year",
      "nameAr": "السنة الثالثة",
      "header": "🦷 Dentistry 3rd year",
      "folder": null,
      "semesters": [
        {
          "id": "s1",
          "name": "Semester 1",
          "nameAr": "الفصل الأول",
          "folder": null,
          "subjects": [
            {
              "id": "ocih",
              "slug": null,
              "name": "Oral Cavity",
              "nameAr": "تجويف الفم",
              "emoji": "👄",
              "color": "pink",
              "base": null,
              "practical": {
                "lecture": [
                  3,
                  9,
                  17,
                  20,
                  23,
                  26,
                  28,
                  29,
                  32,
                  35,
                  37
                ],
                "pdf": [
                  3,
                  9,
                  17,
                  20,
                  23,
                  26,
                  28,
                  29,
                  32,
                  35,
                  37
                ]
              }
            },
            {
              "id": "radiology",
              "slug": "rad",
              "name": "Radiology",
              "nameAr": "الأشعة",
              "emoji": "☢️",
              "color": "yellow",
              "base": null,
              "practical": null
            },
            {
              "id": "preclinical",
              "slug": "pre",
              "name": "Preclinical",
              "nameAr": "ما قبل السريري",
              "emoji": "🔬",
              "color": "purple",
              "base": null,
              "practical": null
            },
            {
              "id": "pharmacology",
              "slug": "pha",
              "name": "Pharmacology",
              "nameAr": "علم الأدوية",
              "emoji": "💊",
              "color": "cyan",
              "base": null,
              "practical": null
            },
            {
              "id": "pathology",
              "slug": "patho",
              "name": "Pathology",
              "nameAr": "علم الأمراض",
              "emoji": "🧬",
              "color": "green",
              "base": null,
              "practical": null
            },
            {
              "id": "patient-safety",
              "slug": "ps",
              "name": "Patient Safety",
              "nameAr": "سلامة المريض",
              "emoji": "🛡️",
              "color": "blue",
              "base": null,
              "practical": null
            }
          ]
        },
        {
          "id": "s2",
          "name": "Semester 2",
          "nameAr": "الفصل الثاني",
          "folder": null,
          "subjects": [
            {
              "id": "ocd",
              "slug": null,
              "name": "Oral Cavity in Disease",
              "nameAr": "أمراض الفم",
              "emoji": "👄",
              "color": "pink",
              "base": null,
              "practical": null
            },
            {
              "id": "psychology",
              "slug": null,
              "name": "Psychology",
              "nameAr": "علم النفس",
              "emoji": "🧠",
              "color": "yellow",
              "base": null,
              "practical": null
            },
            {
              "id": "preclinical",
              "slug": "pre",
              "name": "Preclinical",
              "nameAr": "ما قبل السريري",
              "emoji": "🔬",
              "color": "purple",
              "base": "3rd-year/3rd-s1/preclinical",
              "practical": null
            },
            {
              "id": "elective",
              "slug": null,
              "name": "Elective",
              "nameAr": "مادة اختيارية",
              "emoji": "⭐",
              "color": "cyan",
              "base": null,
              "practical": null
            },
            {
              "id": "bsd",
              "slug": null,
              "name": "Body System in Disease",
              "nameAr": "أمراض أجهزة الجسم",
              "emoji": "🧬",
              "color": "green",
              "base": null,
              "practical": null
            },
            {
              "id": "la",
              "slug": null,
              "name": "Local Anesthesia",
              "nameAr": "التخدير الموضعي",
              "emoji": "💉",
              "color": "blue",
              "base": null,
              "practical": null
            }
          ]
        }
      ]
    },
    {
      "id": "4th",
      "name": "4️⃣th year",
      "nameAr": "4️⃣th year",
      "header": "🦷 Dentistry 4th year",
      "folder": null,
      "semesters": [
        {
          "id": "s1",
          "name": "Semester 1",
          "nameAr": "الفصل الأول",
          "folder": null,
          "subjects": []
        },
        {
          "id": "s2",
          "name": "Semester 2",
          "nameAr": "الفصل الثاني",
          "folder": null,
          "subjects": []
        },
        {
          "id": "full",
          "name": "Full year",
          "nameAr": "السنة كاملة",
          "folder": null,
          "subjects": []
        }
      ]
    }
  ]
} as const;

export const DUAS: string[] = SITE.duas;
