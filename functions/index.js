const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getAuth } = require("firebase-admin/auth");
const { initializeApp } = require("firebase-admin/app");

initializeApp();

exports.deleteUserAccount = onCall({
    // IMPORTANT: In production, enforce role checks here or via security rules
}, async (request) => {
    // Check if user is authenticated
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    
    const uid = request.data.uid;

    if (!uid) {
        throw new HttpsError("invalid-argument", "The function must be called with a UID.");
    }

    // Optional: Check if the requester has permission to delete this user
    // const callerUid = request.auth.uid;
    // ... logic to verify caller is principal of same school ...

    try {
        await getAuth().deleteUser(uid);
        return { success: true, message: `User ${uid} deleted successfully from Auth.` };
    } catch (error) {
        console.error("Error deleting user:", error);
        throw new HttpsError("internal", error.message);
    }
});
