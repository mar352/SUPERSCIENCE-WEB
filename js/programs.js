// SUPERSCIENCE - Evidence-Based Workout Protocols & Hypertrophy Plans
export const workoutPrograms = [
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
          { name: "Dumbbell Overhead Shoulder Press", muscle: "Anterior & Lateral Deltoids", sets: "3", reps: "8-10", rir: "2 RIR", rest: "2.5 min", cue: "Keep elbows tucked 30° into scapular plane." },
          { name: "Incline Dumbbell Bicep Curl", muscle: "Biceps (Long Head Lengthened)", sets: "3", reps: "10-12", rir: "1 RIR", rest: "90 sec", cue: "Allow elbows to sit behind torso on a 45° incline bench for maximal stretch." },
          { name: "Reverse Cable Flye", muscle: "Rear Deltoid & External Rotators", sets: "3", reps: "15-20", rir: "1 RIR", rest: "60 sec", cue: "Slight arm abduction without shrugging upper traps." }
        ]
      },
      {
        dayName: "Day 5: Lower Hypertrophy B",
        focus: "Glutes, Quads, Adductors, Calves",
        exercises: [
          { name: "Barbell Back Squat / Safety Bar Squat", muscle: "Quads, Gluteus Maximus", sets: "3", reps: "6-8", rir: "2 RIR", rest: "3.5 min", cue: "Brace core against belt; descend smoothly with knees tracking over toes." },
          { name: "Dumbbell Walking Lunge", muscle: "Glutes & Quads", sets: "3", reps: "12 steps/leg", rir: "2 RIR", rest: "2 min", cue: "Slight forward torso lean to maximize glute recruitment." },
          { name: "Leg Extension (Lengthened Partials)", muscle: "Rectus Femoris", sets: "3", reps: "12-15", rir: "0 RIR", rest: "90 sec", cue: "Focus on control; add 5 bottom-half partial reps after technical failure." },
          { name: "Seated Calf Raise", muscle: "Soleus", sets: "3", reps: "15-20", rir: "0 RIR", rest: "60 sec", cue: "Smooth rhythmic cadence with deep bottom stretch." }
        ]
      }
    ]
  },
  {
    id: "PROG-PPL-6D",
    title: "02. 6-Day Push / Pull / Legs Volume Matrix",
    subtitle: "High-Frequency Hypertrophy for Complete Muscle Stimulation",
    split: "ppl",
    splitLabel: "Push Pull Legs (6-Day)",
    frequency: "6 Days / Week",
    duration: "60 Min",
    intensity: "0 - 2 RIR",
    weeklyVolume: "18 - 22 Sets / Muscle Group",
    experienceLevel: "Advanced",
    image: "assets/stock/program_ppl.jpg",
    apparelRecommendation: {
      productId: "SS-HD-01",
      name: "Oversized French Terry Hoodie",
      reason: "450 GSM heavyweight cotton retains optimal muscle temperature during high-density training blocks."
    },
    scientificPrinciples: [
      "High frequency allows distributing total weekly volume across shorter, higher-intensity sessions.",
      "Reduces intra-session fatigue, keeping average set quality closer to maximum motor unit recruitment.",
      "Targeted isolation exercises utilize lengthened-position resistance curves."
    ],
    days: [
      {
        dayName: "Day 1 & 4: Push (Chest, Shoulders, Triceps)",
        focus: "Horizontal & Vertical Pressing",
        exercises: [
          { name: "Barbell Bench Press", muscle: "Chest & Triceps", sets: "4", reps: "6-8", rir: "2 RIR", rest: "3 min", cue: "Bar path curves slightly backward over shoulders at lockout." },
          { name: "Seated Dumbbell Shoulder Press", muscle: "Front Delts", sets: "3", reps: "8-10", rir: "2 RIR", rest: "2 min", cue: "Control the eccentric down to chin level." },
          { name: "Dips (Weighted or Bodyweight)", muscle: "Lower Chest & Triceps", sets: "3", reps: "8-12", rir: "1 RIR", rest: "2 min", cue: "Lean forward 20 degrees for chest focus." },
          { name: "Cable Lateral Raises", muscle: "Side Delts", sets: "4", reps: "15", rir: "1 RIR", rest: "60 sec", cue: "Smooth continuous tension." },
          { name: "Overhead Rope Tricep Extension", muscle: "Long Head of Triceps", sets: "3", reps: "12-15", rir: "0 RIR", rest: "90 sec", cue: "Deep stretch behind the head." }
        ]
      },
      {
        dayName: "Day 2 & 5: Pull (Back, Rear Delts, Biceps)",
        focus: "Vertical & Horizontal Pulling",
        exercises: [
          { name: "Barbell Bent-Over Row", muscle: "Upper Back & Lats", sets: "4", reps: "8-10", rir: "2 RIR", rest: "2.5 min", cue: "Maintain 45-degree hip hinge and pull to lower ribs." },
          { name: "Weighted Pull-Ups / Lat Pulldown", muscle: "Lats", sets: "3", reps: "6-8", rir: "1 RIR", rest: "2.5 min", cue: "Full dead-hang stretch at the top." },
          { name: "Single-Arm Dumbbell Row", muscle: "Lower Lat", sets: "3", reps: "10-12", rir: "1 RIR", rest: "90 sec", cue: "Pull elbow back along ribcage." },
          { name: "Incline Dumbbell Bicep Curl", muscle: "Biceps", sets: "3", reps: "10-12", rir: "1 RIR", rest: "90 sec", cue: "Keep elbows behind body for peak bicep stretch." },
          { name: "Face Pulls", muscle: "Rear Delts & Rotator Cuff", sets: "3", reps: "15-20", rir: "1 RIR", rest: "60 sec", cue: "Pull rope to forehead with external rotation." }
        ]
      },
      {
        dayName: "Day 3 & 6: Legs (Quads, Hamstrings, Calves)",
        focus: "Knee Flexion & Hip Extension",
        exercises: [
          { name: "Barbell Squat", muscle: "Quads & Glutes", sets: "4", reps: "6-8", rir: "2 RIR", rest: "3.5 min", cue: "Consistent depth below parallel." },
          { name: "Romanian Deadlift", muscle: "Hamstrings", sets: "3", reps: "8-10", rir: "2 RIR", rest: "3 min", cue: "Hinge hips backward until deep tension is felt." },
          { name: "Leg Press (Feet Low on Platform)", muscle: "Quads", sets: "3", reps: "10-12", rir: "1 RIR", rest: "2 min", cue: "Maximum knee flexion without pelvic tuck." },
          { name: "Lying Leg Curl", muscle: "Hamstrings", sets: "3", reps: "12-15", rir: "0 RIR", rest: "90 sec", cue: "Do not lift hips off pad." },
          { name: "Calf Raises", muscle: "Calves", sets: "4", reps: "12-15", rir: "0 RIR", rest: "60 sec", cue: "2-second stretch pause." }
        ]
      }
    ]
  },
  {
    id: "PROG-PB-5D",
    title: "03. 5-Day Powerbuilding System",
    subtitle: "Heavy Compound Progression Combined with Hypertrophy Clusters",
    split: "powerbuilding",
    splitLabel: "Powerbuilding (5-Day)",
    frequency: "5 Days / Week",
    duration: "75 Min",
    intensity: "1 - 3 RIR",
    weeklyVolume: "14 - 18 Sets / Muscle Group",
    experienceLevel: "Intermediate / Advanced",
    image: "assets/stock/program_powerbuilding.jpg",
    apparelRecommendation: {
      productId: "SS-PNT-01",
      name: "Wide-Leg Relaxed Sweatpants",
      reason: "Heavyweight 400 GSM brushed cotton with zero knee constriction for maximum squat and deadlift mechanics."
    },
    scientificPrinciples: [
      "Wave periodization on the core Squat, Bench Press, and Deadlift (SBD) movements.",
      "Compound power movements (3–5 reps) generate high mechanical tension and myofibrillar hypertrophy.",
      "Accessory clusters (8–15 reps) drive sarcoplasmic volume and localized muscular endurance."
    ],
    days: [
      {
        dayName: "Day 1: Heavy Squat & Quad Hypertrophy",
        focus: "Squat Strength + Leg Volume",
        exercises: [
          { name: "Barbell Back Squat", muscle: "Quads & Core", sets: "4", reps: "4-6", rir: "2 RIR", rest: "3.5 min", cue: "Aggressive brace and explosive drive out of the hole." },
          { name: "Bulgarian Split Squat", muscle: "Quads & Glutes", sets: "3", reps: "8-10/leg", rir: "1 RIR", rest: "2 min", cue: "Vertical shin angle for maximum quad overload." },
          { name: "Leg Extension", muscle: "Quads", sets: "3", reps: "12-15", rir: "0 RIR", rest: "90 sec", cue: "Hard 1-second contraction at the top." },
          { name: "Hanging Leg Raise", muscle: "Rectus Abdominis", sets: "3", reps: "12-15", rir: "1 RIR", rest: "60 sec", cue: "Tilt pelvis upward to engage lower abs." }
        ]
      },
      {
        dayName: "Day 2: Heavy Bench & Upper Volume",
        focus: "Bench Press Strength + Upper Hypertrophy",
        exercises: [
          { name: "Barbell Bench Press", muscle: "Pectorals", sets: "5", reps: "3-5", rir: "2 RIR", rest: "3.5 min", cue: "Control touch point at sternum; drive feet into the floor." },
          { name: "Incline Dumbbell Press", muscle: "Upper Chest", sets: "3", reps: "8-10", rir: "1 RIR", rest: "2 min", cue: "Deep stretch at bottom." },
          { name: "Weighted Dips", muscle: "Triceps & Chest", sets: "3", reps: "6-8", rir: "1 RIR", rest: "2.5 min", cue: "Lockout triceps decisively." },
          { name: "Skull Crushers (EZ Bar)", muscle: "Triceps", sets: "3", reps: "10-12", rir: "1 RIR", rest: "90 sec", cue: "Lower bar toward forehead/bench behind head." }
        ]
      },
      {
        dayName: "Day 3: Deadlift & Posterior Chain",
        focus: "Deadlift Strength + Back Density",
        exercises: [
          { name: "Conventional / Sumo Deadlift", muscle: "Posterior Chain", sets: "4", reps: "3-5", rir: "2 RIR", rest: "4 min", cue: "Slack pull from barbell before breaking the floor." },
          { name: "Chest-Supported Row", muscle: "Lats & Rhomboids", sets: "3", reps: "8-10", rir: "1 RIR", rest: "2 min", cue: "Squeeze shoulder blades for 1 second." },
          { name: "Glute-Ham Developer (GHD) / Back Extension", muscle: "Hamstrings", sets: "3", reps: "10-12", rir: "1 RIR", rest: "90 sec", cue: "Hinge through hips." },
          { name: "Barbell Shrugs", muscle: "Trapezius", sets: "3", reps: "12-15", rir: "1 RIR", rest: "60 sec", cue: "Straight elevation; do not roll shoulders." }
        ]
      },
      {
        dayName: "Day 4: Shoulder & Upper Back Focus",
        focus: "Overhead Strength & Lat Width",
        exercises: [
          { name: "Standing Overhead Barbell Press (OHP)", muscle: "Deltoids", sets: "4", reps: "5-6", rir: "2 RIR", rest: "3 min", cue: "Glutes squeezed tight; push head through window at top." },
          { name: "Lat Pulldown (Wide Grip)", muscle: "Lats", sets: "4", reps: "8-10", rir: "1 RIR", rest: "2 min", cue: "Full vertical stretch." },
          { name: "Lateral Raises (Giant Set)", muscle: "Side Delts", sets: "4", reps: "12-15", rir: "0 RIR", rest: "60 sec", cue: "Strict form with no momentum." },
          { name: "Barbell Bicep Curl", muscle: "Biceps", sets: "3", reps: "8-10", rir: "1 RIR", rest: "90 sec", cue: "Keep elbows pinned to sides." }
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
