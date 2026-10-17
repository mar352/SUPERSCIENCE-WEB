// SUPERSCIENCE - Default Science-Based Workout Protocols Data
// Used for PostgreSQL seeding and server in-memory fallback

const initialPrograms = [
  {
    id: "PROG-UL-4D",
    title: "01. 4-Day Upper / Lower Protocol",
    subtitle: "Evidence-Based Hypertrophy & Volume Landmark Optimization",
    split: "upper-lower",
    splitLabel: "Upper / Lower (4-Day)",
    frequency: "4 Days / Week",
    duration: "60 - 75 Min",
    intensity: "1 - 3 RIR (Proximity to Failure)",
    weeklyVolume: "12 - 16 Sets / Muscle Group",
    experienceLevel: "Intermediate / Advanced",
    image: "assets/stock/program_upper_lower.jpg",
    apparelRecommendation: {
      productId: "SS-TEE-01",
      name: "Heavyweight Boxy Tee (Washed Black)",
      reason: "Structured 380 GSM chest drape allows maximum lat flare and unrestricted shoulder rotation."
    },
    scientificPrinciples: [
      "Optimal 2x/week frequency maximizes the muscle protein synthesis (MPS) window.",
      "Emphasis on lengthened-partial loading (e.g. Incline DB Press at deep stretch, Seated Leg Curls).",
      "Calibrated 1–3 RIR ensures high mechanical tension without central nervous system burnout."
    ],
    days: [
      {
        dayName: "Day 1: Upper Hypertrophy A",
        focus: "Chest, Upper Back, Delts, Triceps",
        exercises: [
          { name: "Incline Dumbbell Press (30° Angle)", muscle: "Clavicular Pec Head", sets: "3", reps: "8-10", rir: "2 RIR", rest: "2.5 min", cue: "Pause for 1 full second at the bottom deep stretch to overload lengthened fibers." },
          { name: "Chest-Supported T-Bar Row", muscle: "Latissimus Dorsi & Rhomboids", sets: "3", reps: "10-12", rir: "2 RIR", rest: "2 min", cue: "Drive elbows back into hip pockets; do not hyperextend lumbar spine." },
          { name: "Flat Barbell Bench Press", muscle: "Sternal Pec & Anterior Delt", sets: "3", reps: "6-8", rir: "1 RIR", rest: "3 min", cue: "Maintain leg drive and tight scapular retraction throughout the eccentric." },
          { name: "Cable Lateral Raise (Behind Body)", muscle: "Lateral Deltoid", sets: "4", reps: "12-15", rir: "1 RIR", rest: "90 sec", cue: "Set cable height at wrist level for continuous tension at mid-range." },
          { name: "Cross-Body Tricep Extension", muscle: "Triceps Long & Lateral Heads", sets: "3", reps: "12-15", rir: "0-1 RIR", rest: "90 sec", cue: "Extend across torso line to align with tricep muscle fiber orientation." }
        ]
      },
      {
        dayName: "Day 2: Lower Hypertrophy A",
        focus: "Quadriceps, Hamstrings, Calves, Core",
        exercises: [
          { name: "Barbell Romanian Deadlift (RDL)", muscle: "Hamstrings & Glutes", sets: "3", reps: "8-10", rir: "2 RIR", rest: "3 min", cue: "Hinge hips straight backward until hamstrings reach peak stretch; maintain neutral neck." },
          { name: "Hack Squat / Pendulum Squat", muscle: "Quadriceps (Vastus Medialis/Lateralis)", sets: "3", reps: "8-10", rir: "1 RIR", rest: "3 min", cue: "Control a 3-second descent into full knee flexion for maximum quadricep stretch." },
          { name: "Seated Leg Curl", muscle: "Hamstrings (Lengthened Position)", sets: "3", reps: "10-12", rir: "1 RIR", rest: "2 min", cue: "Sit fully upright with hip flexion for heightened passive hamstring tension." },
          { name: "Standing Barbell Calf Raise", muscle: "Gastrocnemius", sets: "4", reps: "10-12", rir: "0 RIR", rest: "90 sec", cue: "Hold a 2-second isometric pause at the deep bottom stretch." }
        ]
      },
      {
        dayName: "Day 3: Active Rest / Recovery",
        focus: "Mobility, Light Zone 2 Cardio & Tissue Recovery",
        exercises: [
          { name: "Light 30-min Incline Treadmill Walk", muscle: "Cardiovascular Health", sets: "1", reps: "30 min", rir: "Zone 2", rest: "N/A", cue: "Promote systemic blood flow without inducing localized muscular fatigue." },
          { name: "Thoracic Spine & Hip Mobility Flow", muscle: "Joint Capsules & Tendons", sets: "3", reps: "10 reps", rir: "Easy", rest: "60 sec", cue: "Maintain joint health for heavy compound lifting days." }
        ]
      },
      {
        dayName: "Day 4: Upper Hypertrophy B",
        focus: "Lats, Upper Chest, Rear Delts, Biceps",
        exercises: [
          { name: "Neutral-Grip Lat Pulldown", muscle: "Latissimus Dorsi", sets: "3", reps: "10-12", rir: "2 RIR", rest: "2 min", cue: "Pull through the elbows down to ribs with upright posture." },
          { name: "Low-to-High Cable Chest Flye", muscle: "Upper Pectorals", sets: "3", reps: "12-15", rir: "1 RIR", rest: "90 sec", cue: "Adduct hands upward along clavicular fiber line." },
          { name: "Incline Dumbbell Bicep Curl", muscle: "Biceps Long Head (Stretch)", sets: "3", reps: "10-12", rir: "1 RIR", rest: "90 sec", cue: "Allow elbows to sit behind torso for peak passive sarcomere elongation." },
          { name: "Reverse Pec Deck Flye", muscle: "Posterior Deltoid", sets: "3", reps: "15-20", rir: "0 RIR", rest: "60 sec", cue: "Keep shoulders depressed to remove upper trap involvement." }
        ]
      },
      {
        dayName: "Day 5: Lower Hypertrophy B",
        focus: "Hamstrings, Quads, Adductors, Calves",
        exercises: [
          { name: "Seated Leg Curl (Pre-Exhaust)", muscle: "Hamstrings", sets: "3", reps: "12-15", rir: "1 RIR", rest: "90 sec", cue: "Warm up knee joint and establish mind-muscle connection." },
          { name: "Barbell Back Squat / Safety Bar Squat", muscle: "Quads & Glutes", sets: "3", reps: "6-8", rir: "2 RIR", rest: "3 min", cue: "Break at hips and knees simultaneously; descend with control." },
          { name: "Dumbbell Walking Lunge", muscle: "Gluteus Maximus & Quads", sets: "3", reps: "12 steps/leg", rir: "1 RIR", rest: "2 min", cue: "Lean torso slightly forward to bias gluteus stretch." },
          { name: "Seated Calf Raise", muscle: "Soleus", sets: "3", reps: "15-20", rir: "0 RIR", rest: "60 sec", cue: "Slow 3s eccentric with deep heel drop." }
        ]
      }
    ]
  },
  {
    id: "PROG-PPL-6D",
    title: "02. 6-Day Push / Pull / Legs Volume Matrix",
    subtitle: "High-Frequency Hypertrophy Split for Maximal Motor Unit Recruitment",
    split: "ppl",
    splitLabel: "Push / Pull / Legs (6-Day)",
    frequency: "6 Days / Week",
    duration: "65 Min",
    intensity: "1 - 2 RIR",
    weeklyVolume: "16 - 20 Sets / Muscle Group",
    experienceLevel: "Advanced",
    image: "assets/stock/program_ppl.jpg",
    apparelRecommendation: {
      productId: "SS-SHO-01",
      name: "Heavyweight French Terry Shorts",
      reason: "Above-the-knee 6-inch inseam prevents fabric snag during deep pendulum squats and leg press sleds."
    },
    scientificPrinciples: [
      "Distributes high weekly volume into 2 micro-doses per week for superior per-session quality.",
      "Separates horizontal and vertical loading vectors across Push A/B and Pull A/B sessions.",
      "Incorporates myo-reps and drop sets on isolation accessories to maximize metabolic stress."
    ],
    days: [
      {
        dayName: "Day 1: Push A (Chest Dominant)",
        focus: "Chest, Anterior Delts, Lateral Delts, Triceps",
        exercises: [
          { name: "Barbell Flat Bench Press", muscle: "Mid Pec", sets: "4", reps: "6-8", rir: "2 RIR", rest: "3 min", cue: "Solid arch, leg drive." },
          { name: "Incline Dumbbell Press", muscle: "Clavicular Pec", sets: "3", reps: "8-10", rir: "1 RIR", rest: "2 min", cue: "Controlled stretch." },
          { name: "Cable Lateral Raise", muscle: "Side Delts", sets: "4", reps: "12-15", rir: "1 RIR", rest: "90 sec", cue: "Constant tension." },
          { name: "Overhead Rope Tricep Extension", muscle: "Triceps Long Head", sets: "3", reps: "12-15", rir: "0 RIR", rest: "90 sec", cue: "Deep elbow bend." }
        ]
      },
      {
        dayName: "Day 2: Pull A (Lat Dominant)",
        focus: "Lats, Upper Back, Biceps, Rear Delts",
        exercises: [
          { name: "Neutral-Grip Lat Pulldown", muscle: "Lats", sets: "4", reps: "8-10", rir: "2 RIR", rest: "2 min", cue: "Elbows driving to hip pockets." },
          { name: "Chest-Supported Row", muscle: "Upper Back", sets: "3", reps: "10-12", rir: "1 RIR", rest: "2 min", cue: "Squeeze shoulder blades." },
          { name: "Incline Dumbbell Curl", muscle: "Biceps", sets: "3", reps: "10-12", rir: "1 RIR", rest: "90 sec", cue: "Full stretch at bottom." },
          { name: "Face Pulls", muscle: "Rear Delts", sets: "3", reps: "15-20", rir: "0 RIR", rest: "60 sec", cue: "External rotation." }
        ]
      },
      {
        dayName: "Day 3: Legs A (Quad Dominant)",
        focus: "Quadriceps, Hamstrings, Calves",
        exercises: [
          { name: "Hack Squat", muscle: "Quads", sets: "4", reps: "8-10", rir: "1 RIR", rest: "3 min", cue: "Full knee bend, slow tempo." },
          { name: "Romanian Deadlift", muscle: "Hamstrings", sets: "3", reps: "8-10", rir: "2 RIR", rest: "2.5 min", cue: "Deep hinge." },
          { name: "Leg Extension", muscle: "Rectus Femoris", sets: "3", reps: "12-15", rir: "0 RIR", rest: "90 sec", cue: "Hold 1s top squeeze." },
          { name: "Standing Calf Raise", muscle: "Calves", sets: "4", reps: "12-15", rir: "0 RIR", rest: "60 sec", cue: "2s pause at bottom stretch." }
        ]
      },
      {
        dayName: "Day 4: Push B (Shoulder & Tricep Dominant)",
        focus: "Overhead Delts, Upper Pecs, Triceps",
        exercises: [
          { name: "Seated Dumbbell Shoulder Press", muscle: "Anterior Delt", sets: "4", reps: "8-10", rir: "1 RIR", rest: "2.5 min", cue: "Slight natural arch." },
          { name: "Flat Dumbbell Flye-Press", muscle: "Chest Stretch", sets: "3", reps: "10-12", rir: "1 RIR", rest: "2 min", cue: "Deep stretch emphasis." },
          { name: "Dumbbell Lateral Raise", muscle: "Side Delts", sets: "4", reps: "12-15", rir: "0 RIR", rest: "60 sec", cue: "Lead with elbows." },
          { name: "Dips / Weighted Dips", muscle: "Triceps & Lower Pec", sets: "3", reps: "8-10", rir: "1 RIR", rest: "2 min", cue: "Upright torso for triceps." }
        ]
      },
      {
        dayName: "Day 5: Pull B (Thickness & Traps)",
        focus: "Mid-Traps, Rhomboids, Lats, Forearms",
        exercises: [
          { name: "Barbell Bent-Over Row", muscle: "Back Thickness", sets: "4", reps: "6-8", rir: "2 RIR", rest: "2.5 min", cue: "Strict torso angle." },
          { name: "Single-Arm Cable Lat Pulldown", muscle: "Lat Iliac Region", sets: "3", reps: "10-12", rir: "1 RIR", rest: "90 sec", cue: "Reach overhead." },
          { name: "Preacher Curl", muscle: "Biceps Short Head", sets: "3", reps: "10-12", rir: "0 RIR", rest: "90 sec", cue: "Safe eccentric stretch." },
          { name: "Hammer Curls", muscle: "Brachialis", sets: "3", reps: "10-12", rir: "0 RIR", rest: "60 sec", cue: "Thick arm development." }
        ]
      },
      {
        dayName: "Day 6: Legs B (Posterior Chain Dominant)",
        focus: "Hamstrings, Glutes, Quads",
        exercises: [
          { name: "Barbell Hip Thrust", muscle: "Glutes", sets: "4", reps: "8-10", rir: "1 RIR", rest: "2.5 min", cue: "Full hip extension lock." },
          { name: "Seated Leg Curl", muscle: "Hamstrings", sets: "4", reps: "10-12", rir: "0 RIR", rest: "90 sec", cue: "Hold peak contraction." },
          { name: "Leg Press", muscle: "Quads", sets: "3", reps: "12-15", rir: "1 RIR", rest: "2 min", cue: "Feet mid-platform." },
          { name: "Seated Calf Raise", muscle: "Soleus", sets: "4", reps: "15-20", rir: "0 RIR", rest: "60 sec", cue: "Full range of motion." }
        ]
      }
    ]
  },
  {
    id: "PROG-PB-5D",
    title: "03. 5-Day Powerbuilding (SBD + Hypertrophy)",
    subtitle: "Heavy Compound Strength (Squat, Bench, Deadlift) + Accessory Clusters",
    split: "powerbuilding",
    splitLabel: "Powerbuilding (5-Day)",
    frequency: "5 Days / Week",
    duration: "75 Min",
    intensity: "RPE 8 - 9.5 (Compounds) / 0 - 1 RIR (Accessories)",
    weeklyVolume: "14 - 18 Sets / Muscle Group",
    experienceLevel: "Intermediate / Advanced",
    image: "assets/stock/program_powerbuilding.jpg",
    apparelRecommendation: {
      productId: "SS-CAP-01",
      name: "Vintage Suede Trucker Cap",
      reason: "High-airflow mesh and snug 6-panel strapback keeps hair and chalk dust clear during heavy squat and deadlift sets."
    },
    scientificPrinciples: [
      "Combines mechanical tension from 80-88% 1RM neural compounds with metabolic volume accessories.",
      "Periodizes intensity using RPE (Rate of Perceived Exertion) on primary compounds to avoid injury.",
      "Employs back-off volume sets at 70% 1RM for hypertrophy stimulus following top heavy triples."
    ],
    days: [
      {
        dayName: "Day 1: Heavy Squat & Quad Cluster",
        focus: "Barbell Back Squat, Leg Press, Calves",
        exercises: [
          { name: "Barbell Back Squat", muscle: "Quads & Glutes", sets: "4", reps: "4-6", rir: "RPE 8", rest: "3.5 min", cue: "Brace abdominal wall; drive knees forward over toes." },
          { name: "Leg Press (High Volume)", muscle: "Quads", sets: "3", reps: "10-12", rir: "1 RIR", rest: "2.5 min", cue: "Control the eccentric descent." },
          { name: "Bulgarian Split Squat", muscle: "Gluteus & Quads", sets: "3", reps: "8-10/leg", rir: "1 RIR", rest: "2 min", cue: "Keep front shin vertical." },
          { name: "Standing Calf Raise", muscle: "Calves", sets: "4", reps: "10-12", rir: "0 RIR", rest: "90 sec", cue: "Pause at bottom." }
        ]
      },
      {
        dayName: "Day 2: Heavy Bench & Upper Hypertrophy",
        focus: "Barbell Bench Press, Incline DB, Rows",
        exercises: [
          { name: "Barbell Bench Press", muscle: "Chest", sets: "4", reps: "4-6", rir: "RPE 8.5", rest: "3.5 min", cue: "Leg drive anchored, touch lower sternum." },
          { name: "Incline Dumbbell Press", muscle: "Upper Chest", sets: "3", reps: "8-10", rir: "1 RIR", rest: "2 min", cue: "30° bench angle." },
          { name: "Barbell Pendlay Row", muscle: "Lats & Mid-Back", sets: "3", reps: "6-8", rir: "1 RIR", rest: "2 min", cue: "Pull from floor each rep." },
          { name: "Overhead Tricep Extension", muscle: "Triceps", sets: "3", reps: "10-12", rir: "0 RIR", rest: "90 sec", cue: "Elbows tucked." }
        ]
      },
      {
        dayName: "Day 3: Heavy Deadlift & Posterior Chain",
        focus: "Conventional / Sumo Deadlift, Hamstrings, Lats",
        exercises: [
          { name: "Barbell Deadlift (Top Set + Backoffs)", muscle: "Posterior Chain", sets: "3", reps: "3-5", rir: "RPE 8.5", rest: "4 min", cue: "Wedge hips; drag bar up shins." },
          { name: "Barbell Romanian Deadlift", muscle: "Hamstrings", sets: "3", reps: "8-10", rir: "2 RIR", rest: "2.5 min", cue: "Soft knees, maximum hip hinge." },
          { name: "Weighted Pull-Ups", muscle: "Lats", sets: "3", reps: "6-8", rir: "1 RIR", rest: "2.5 min", cue: "Full dead-hang at bottom." },
          { name: "Barbell Shrugs", muscle: "Upper Traps", sets: "4", reps: "10-12", rir: "0 RIR", rest: "90 sec", cue: "Hold 1s peak squeeze." }
        ]
      },
      {
        dayName: "Day 4: Overhead Press & Shoulder Hypertrophy",
        focus: "Military Press, Side Delts, Arms",
        exercises: [
          { name: "Standing Barbell Overhead Press", muscle: "Anterior Delts", sets: "4", reps: "5-6", rir: "RPE 8", rest: "3 min", cue: "Tight glutes and core." },
          { name: "Dumbbell Lateral Raise (Drop Set)", muscle: "Lateral Delts", sets: "4", reps: "12-15", rir: "0 RIR", rest: "60 sec", cue: "Lead with elbows." },
          { name: "Barbell Bicep Curl", muscle: "Biceps", sets: "3", reps: "8-10", rir: "1 RIR", rest: "90 sec", cue: "No swinging." },
          { name: "Skull Crushers", muscle: "Triceps", sets: "3", reps: "10-12", rir: "0 RIR", rest: "90 sec", cue: "Lower to hairline." }
        ]
      },
      {
        dayName: "Day 5: Full Body Pump & Density",
        focus: "Metabolic Stress & Accessory Hypertrophy",
        exercises: [
          { name: "Front Squats / Leg Press", muscle: "Quads", sets: "3", reps: "8-10", rir: "1 RIR", rest: "2.5 min", cue: "Deep upright knee bend." },
          { name: "Close-Grip Bench Press", muscle: "Triceps & Chest", sets: "3", reps: "8-10", rir: "1 RIR", rest: "2 min", cue: "Shoulder-width grip." },
          { name: "Seated Cable Row", muscle: "Lats", sets: "3", reps: "10-12", rir: "1 RIR", rest: "90 sec", cue: "Squeeze lats." },
          { name: "Hammer Curls", muscle: "Brachialis & Forearms", sets: "3", reps: "10-12", rir: "0 RIR", rest: "60 sec", cue: "Neutral grip for arm thickness." }
        ]
      }
    ]
  },
  {
    id: "PROG-FB-3D",
    title: "04. 3-Day Full Body Efficiency System",
    subtitle: "High-Yield Minimalist Training for Maximum Stimulus per Hour",
    split: "full-body",
    splitLabel: "Full Body (3-Day)",
    frequency: "3 Days / Week",
    duration: "55 Min",
    intensity: "1 - 2 RIR",
    weeklyVolume: "9 - 12 Sets / Muscle Group",
    experienceLevel: "All Levels",
    image: "assets/stock/program_fullbody.jpg",
    apparelRecommendation: {
      productId: "SS-TEE-02",
      name: "Chalk-White Boxy Tee",
      reason: "380 GSM breathable cotton tailored for rapid transitions and high-density superset sessions."
    },
    scientificPrinciples: [
      "Antagonistic supersets (e.g. Quad Press paired with Hamstring Curl) halve rest time without compromising strength.",
      "Focuses strictly on compound multi-joint movements with the highest stimulus-to-fatigue ratio.",
      "Guarantees 48 hours of full recovery between full-body exposures."
    ],
    days: [
      {
        dayName: "Workout A: Quad, Chest & Back Dominant",
        focus: "Heavy Knee Bend, Horizontal Push/Pull",
        exercises: [
          { name: "Barbell Back Squat", muscle: "Quads & Glutes", sets: "3", reps: "6-8", rir: "2 RIR", rest: "3 min", cue: "Braced core, smooth depth." },
          { name: "Flat Barbell Bench Press", muscle: "Chest", sets: "3", reps: "6-8", rir: "2 RIR", rest: "2.5 min", cue: "Controlled descent." },
          { name: "Chest-Supported Row", muscle: "Upper Back", sets: "3", reps: "8-10", rir: "1 RIR", rest: "2 min", cue: "Retract scapulae fully." },
          { name: "Standing Calf Raise", muscle: "Calves", sets: "3", reps: "12-15", rir: "0 RIR", rest: "60 sec", cue: "Deep bottom stretch." }
        ]
      },
      {
        dayName: "Workout B: Hinge, Vertical Push/Pull",
        focus: "Hip Extension, Overhead Pressing, Lats",
        exercises: [
          { name: "Barbell Romanian Deadlift", muscle: "Hamstrings", sets: "3", reps: "8-10", rir: "2 RIR", rest: "3 min", cue: "Full hip hinge stretch." },
          { name: "Standing Overhead Press", muscle: "Shoulders", sets: "3", reps: "6-8", rir: "2 RIR", rest: "2.5 min", cue: "Tight glutes and core." },
          { name: "Neutral Grip Lat Pulldown", muscle: "Lats", sets: "3", reps: "8-10", rir: "1 RIR", rest: "2 min", cue: "Drive elbows to hips." },
          { name: "Incline Dumbbell Bicep Curl", muscle: "Biceps", sets: "3", reps: "10-12", rir: "0 RIR", rest: "60 sec", cue: "Full bicep stretch." }
        ]
      },
      {
        dayName: "Workout C: Full Kinetic Chain & Hypertrophy",
        focus: "Leg Press, Incline Chest, Arms",
        exercises: [
          { name: "Leg Press", muscle: "Quads", sets: "3", reps: "10-12", rir: "1 RIR", rest: "2 min", cue: "Deep knee bend without lower back lift." },
          { name: "Incline Dumbbell Bench Press", muscle: "Upper Chest", sets: "3", reps: "8-10", rir: "1 RIR", rest: "2 min", cue: "30° bench angle." },
          { name: "Single-Arm Cable Row", muscle: "Lats", sets: "3", reps: "10-12", rir: "1 RIR", rest: "90 sec", cue: "Reach forward for lat stretch." },
          { name: "Tricep Pushdown / Dips", muscle: "Triceps", sets: "3", reps: "12-15", rir: "0 RIR", rest: "60 sec", cue: "Full elbow extension." }
        ]
      }
    ]
  }
];

module.exports = { initialPrograms };
