import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/adminModel.js';
import Subscription from '../models/subscriptionModel.js';

dotenv.config();

const diag = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('CONNECTED');
        
        const admins = await Admin.find({});
        console.log('--- ADMINS ---');
        admins.forEach(a => console.log(`Email: "${a.email}"`));
        
        const subscriptions = await Subscription.find({ platform: 'web-push' });
        console.log('--- SUBSCRIPTIONS ---');
        subscriptions.forEach(s => console.log(`Email in Sub: "${s.userEmail}"`));
        
        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
};

diag();
