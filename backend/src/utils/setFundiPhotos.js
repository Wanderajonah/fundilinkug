require("dotenv").config();
const connectDB = require("../config/db");
const User = require("../models/User");

const PORTRAITS = {
  "Peter Plumber": "https://randomuser.me/api/portraits/men/32.jpg",
  "Esther Electrician": "https://randomuser.me/api/portraits/women/44.jpg",
  "Carlos Carpenter": "https://randomuser.me/api/portraits/men/45.jpg",
  "James Welder": "https://randomuser.me/api/portraits/men/67.jpg",
  "Grace Mechanic": "https://randomuser.me/api/portraits/women/68.jpg",
  "Irene Cleaner": "https://randomuser.me/api/portraits/women/26.jpg",
  "Kevin Mason": "https://randomuser.me/api/portraits/men/75.jpg",
  "Hassan Painter": "https://randomuser.me/api/portraits/men/12.jpg",
  "Oscar Electrician": "https://randomuser.me/api/portraits/men/52.jpg",
  "Moses Mechanic": "https://randomuser.me/api/portraits/men/15.jpg",
  "Nancy NailTech": "https://randomuser.me/api/portraits/women/63.jpg",
  "Linda Landscaper": "https://randomuser.me/api/portraits/women/89.jpg",
  "Nandudu Agnes": "https://randomuser.me/api/portraits/women/3.jpg",
};

const run = async () => {
  await connectDB();
  const names = Object.keys(PORTRAITS);
  const users = await User.find({
    role: "fundi",
    profilePhoto: { $in: ["", null] },
    name: { $in: names },
  });
  let updated = 0;
  for (const u of users) {
    const photo = PORTRAITS[u.name];
    if (!photo) continue;
    u.profilePhoto = photo;
    await u.save();
    updated += 1;
    console.log(`Set profile photo for ${u.name}`);
  }
  console.log(`Done. ${updated} fundi(s) updated.`);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
