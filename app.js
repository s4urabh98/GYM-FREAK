const express = require('express');
const session = require("express-session");
const router = express.Router();
// const connectDB = require("./config/database");
const path = require('path');
const passport = require("passport");
const flash = require("connect-flash");
const { default: mongoose } = require('mongoose');
const User = require('./models/User');
const upload = require('./config/multerConfig');
const WorkoutVideo = require('./models/workoutVideos');
const Equipment = require('./models/Equipment');
const Announcement = require('./models/Announcement');
require('dotenv').config();


const app = express();


const MONGO_URL = "mongodb://localhost:27017/GymFreak";
main()
.then(() => {
        console.log("connected to DB");
    })
    .catch((err) => {
        console.log(err);
    });

async function main() {
    await mongoose.connect(MONGO_URL);
}


// Set EJS as the template engine
app.set('view engine', 'ejs');

// Middleware
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(express.json()); // Parse JSON data
app.use(session({ 
    secret: "secret", 
    resave: false, 
    saveUninitialized: true, 
    cookie: { secure: false }
})); // Use `true` if using HTTPS 
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


// Serve static files (CSS, Images, etc.)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'admin')));

// Set path for components
app.set('components', path.join(__dirname, './views/components'));

// Global Variables for Flash Messages
app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    res.locals.error = req.flash("error");
    next();
});

// Add this before your routes
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File is too large. Maximum size is 100MB'
            });
        }
        return res.status(400).json({
            error: err.message
        });
    }
    next(err);
});

// Render landing.ejs at the root ('/')
app.get('/', (req, res) => {
    res.render('components/landing');
});


// API routes
app.use("/api", require("./routes/authroutes")); // Ensure all API routes are prefixed consistently

// Standard login and signup routes
app.get('/login', (req, res) => {
    res.render('components/login', { error: "" });
});

app.get('/signup', (req, res) => {
    res.render('components/signup');
});

// Add this route to get available time slots
app.get('/api/available-slots', async (req, res) => {
    try {
        const slots = await User.aggregate([
            {
                $group: {
                    _id: '$timeSlot',
                    currentMembers: { $sum: 1 }
                }
            }
        ]);

        const allTimeSlots = [
            '6:00-7:00', '7:00-8:00', '8:00-9:00', '9:00-10:00',
            '10:00-11:00', '11:00-12:00', '12:00-13:00', '13:00-14:00',
            '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00',
            '18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-22:00'
        ];

        const availableSlots = allTimeSlots.map(time => {
            const slot = slots.find(s => s._id === time);
            return {
                time,
                currentMembers: slot ? slot.currentMembers : 0
            };
        });

        res.json(availableSlots);
    } catch (err) {
        console.error('Error fetching time slots:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update the signup route as well
app.post('/signup', async (req, res) => {
    try {
        const { name, email, password, weight, height, membershipPlan, timeSlot } = req.body;

        // Check if time slot is full
        const slotCount = await User.countDocuments({
            'timeSlot.time': timeSlot
        });

        if (slotCount >= 20) {
            return res.status(400).send('Selected time slot is full');
        }

        // Create new user
        const user = new User({
            name,
            email,
            password,
            weight,
            height,
            membershipPlan,
            timeSlot: {
                time: timeSlot,
                currentMembers: slotCount + 1
            }
        });

        await user.save();

        // Update slot count
        await User.updateMany(
            { 'timeSlot.time': timeSlot },
            { $set: { 'timeSlot.currentMembers': slotCount + 1 } }
        );

        res.redirect('/login');
    } catch (err) {
        console.error('Error in signup:', err);
        res.status(500).send('Error in signup');
    }
});

// Member and admin dashboard routes
app.get('/member-dashboard', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const userData = await User.findById(req.session.user._id);
        if (!userData) {
            return res.redirect('/login');
        }

        const user = {
            name: userData.name || 'Member',
            membershipStatus: userData.membershipStatus || 'inactive',
            membershipPlan: userData.membershipPlan || 'none',
            timeSlot: {
                time: userData.timeSlot?.time || 'Not Set',
                currentMembers: userData.timeSlot?.currentMembers || 0
            },
            weight: userData.weight || 0,
            height: userData.height || 0,
            role: userData.role || 'member'
        };

        if (user.role !== 'member') {
            return res.redirect('/admin-dashboard');
        }

        const videos = await WorkoutVideo.find()
            .sort({ createdAt: -1 })
            .limit(3);

        const equipment = await Equipment.find()
            .sort({ condition: -1 })
            .limit(4);

        res.render('components/member-dashboard', {
            user,
            videos: videos || [],
            equipment: equipment || []
        });
    } catch (err) {
        console.error('Error loading member dashboard:', err);
        res.status(500).send('Error loading dashboard');
    }
});

app.get('/admin-dashboard', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const userData = await User.findById(req.session.user._id);
        if (!userData) {
            return res.redirect('/login');
        }

        if (userData.role !== 'admin') {
            return res.redirect('/member-dashboard');
        }

        const [totalMembers, activeMembers, yogaMembers, cardioMembers, exerciseMembers] = await Promise.all([
            User.countDocuments({ role: 'member' }),
            User.countDocuments({ role: 'member', membershipStatus: 'active' }),
            User.countDocuments({ role: 'member', membershipPlan: 'yoga' }),
            User.countDocuments({ role: 'member', membershipPlan: 'cardio' }),
            User.countDocuments({ role: 'member', membershipPlan: 'exercise' })
        ]);

        const user = {
            name: userData.name || 'Admin',
            role: 'admin'
        };

        res.render('components/admin-dashboard', {
            user,
            totalMembers,
            activeMembers,
            yogaMembers,
            cardioMembers,
            exerciseMembers
        });
    } catch (err) {
        console.error('Error fetching member data:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Members management routes
app.get('/members', async (req, res) => {
    try {
        const user = req.session.user || { role: 'admin' };
        if (user.role !== 'admin') {
            return res.status(403).send('Access denied');
        }
        const members = await User.find({ role: 'member' }).select('-password');
        res.render('includes/admin/members', { user, members });
    } catch (err) {
        console.error('Error fetching members:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Add this route for fetching member details
app.get('/api/members/:id', async (req, res) => {
    try {
        const member = await User.findById(req.params.id).select('-password');
        if (!member) {
            return res.status(404).json({ error: 'Member not found' });
        }
        res.json(member);
    } catch (err) {
        console.error('Error fetching member:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/members/:id', async (req, res) => {
    try {
        const { name, email, weight, height, membershipPlan, membershipStatus, timeSlot } = req.body;
        
        // Get current member's data
        const currentMember = await User.findById(req.params.id);
        const oldTimeSlot = currentMember.timeSlot.time;
        const newTimeSlot = timeSlot.time;

        // If time slot is being changed
        if (oldTimeSlot !== newTimeSlot) {
            // Check new slot availability
            const newSlotCount = await User.countDocuments({
                'timeSlot.time': newTimeSlot
            });

            if (newSlotCount >= 20) {
                return res.status(400).json({
                    success: false,
                    error: 'Selected time slot is full'
                });
            }

            // Update old slot count
            await User.updateMany(
                { 'timeSlot.time': oldTimeSlot },
                { $inc: { 'timeSlot.currentMembers': -1 } }
            );

            // Update new slot count
            await User.updateMany(
                { 'timeSlot.time': newTimeSlot },
                { $inc: { 'timeSlot.currentMembers': 1 } }
            );
        }

        // Update member details
        const updatedMember = await User.findByIdAndUpdate(
            req.params.id,
            {
                name,
                email,
                weight,
                height,
                membershipPlan,
                membershipStatus,
                'timeSlot.time': newTimeSlot
            },
            { new: true }
        );

        res.json({ success: true, member: updatedMember });
    } catch (err) {
        console.error('Error updating member:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});


app.get('/api/timeslot-counts', async (req, res) => {
    try {
        const slotCounts = await User.aggregate([
            {
                $group: {
                    _id: '$timeSlot.time',
                    currentMembers: { $sum: 1 }
                }
            }
        ]);
        
        res.json(slotCounts);
    } catch (err) {
        console.error('Error fetching time slot counts:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});



// Workout Videos Routes
app.get('/workout-videos', async (req, res) => {
    try {
        const videos = await WorkoutVideo.find().sort({ createdAt: -1 });
        const user = req.session.user || { role: 'admin' };
        res.render('includes/admin/workout-videos', { videos, user });
    } catch (err) {
        console.error('Error fetching videos:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Update your video creation/update route
app.post('/api/videos', upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
    try {
        // Validate file uploads
        if (!req.files || !req.files['video']) {
            return res.status(400).json({ error: 'Video file is required' });
        }

        // Validate form fields
        const { title, category, description, duration } = req.body;
        if (!title || !category) {
            return res.status(400).json({ error: 'Title and Category are required' });
        }

        const videoPath = '/uploads/videos/' + req.files['video'][0].filename;

        const video = new WorkoutVideo({
            title,
            description: description || '',
            videoPath,
            category,
            duration: duration ? parseInt(duration) : null
        });

        await video.save();
        return res.json({ success: true, video });
    } catch (err) {
        console.error('Error adding video:', err);
        return res.status(500).json({ error: 'Error adding video', details: err.message });
    }
});



app.delete('/api/videos/:id', async (req, res) => {
    try {
        await WorkoutVideo.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting video:', err);
        res.status(500).json({ success: false });
    }
});

//  For members
app.get('/exercise-workout', async (req, res) => {
    try {
        const videos = await WorkoutVideo.find().sort({ createdAt: -1 });
        const user = req.session.user || { role: 'member' };
        res.render('includes/member/exercise-workout', { 
            videos,
            user
        });
    } catch (err) {
        console.error('Error fetching videos:', err);
        res.status(500).send('Internal Server Error');
    }
});



// Equipment Routes
app.get('/equipment', async (req, res) => {
    try {
        const equipment = await Equipment.find().sort({ name: 1 });
        const user = req.session.user || { role: 'admin' };
        res.render('includes/admin/equipment', { equipment, user });
    } catch (err) {
        console.error('Error fetching equipment:', err);
        res.status(500).send('Internal Server Error');
    }
});
// Member equipment route
app.get('/equipments', async (req, res) => {
    try {
        const equipment = await Equipment.find().sort({ name: 1 });
        const user = req.session.user || { role: 'member' };
        res.render('includes/member/availabel-equipments', { 
            equipment,
            user
        });
    } catch (err) {
        console.error('Error fetching equipment:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/api/equipment', async (req, res) => {
    try {
        const { name, description, category, quantity, condition, imageUrl } = req.body;
        const newEquipment = new Equipment({
            name,
            description,
            category,
            quantity,
            condition,
            imageUrl
        });
        await newEquipment.save();
        res.redirect('/equipment');
    } catch (err) {
        console.error('Error adding equipment:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.delete('/api/equipment/:id', async (req, res) => {
    try {
        await Equipment.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting equipment:', err);
        res.status(500).json({ success: false });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`)); // Corrected to use template literals