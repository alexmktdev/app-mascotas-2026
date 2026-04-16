"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePetPhoto = exports.uploadPetPhoto = exports.deleteAdoptionRequest = exports.updateAdoptionRequest = exports.createAdoptionRequest = exports.deletePet = exports.updatePet = exports.createPet = exports.deleteUser = exports.updateUser = exports.createUser = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();
const projectId = process.env.GCLOUD_PROJECT;
const runtimeServiceAccount = process.env.FUNCTIONS_SERVICE_ACCOUNT
    ?? (projectId ? `${projectId}@appspot.gserviceaccount.com` : undefined);
// Compat layer para mantener la firma existente (data, context)
// pero desplegar como Functions v2 en southamerica-west1.
const functions = { https: { HttpsError: https_1.HttpsError } };
const regionalFunctions = {
    https: {
        onCall: (handler) => (0, https_1.onCall)({
            region: 'southamerica-west1',
            ...(runtimeServiceAccount ? { serviceAccount: runtimeServiceAccount } : {}),
        }, async (request) => handler(request.data, { auth: request.auth })),
    },
};
async function getCallerProfile(auth) {
    const snap = await db.collection('profiles').doc(auth.uid).get();
    if (!snap.exists)
        return null;
    return snap.data();
}
async function requireAdmin(auth) {
    const profile = await getCallerProfile(auth);
    if (!profile) {
        throw new functions.https.HttpsError('not-found', 'Perfil no encontrado');
    }
    if (!profile.is_active) {
        throw new functions.https.HttpsError('permission-denied', 'Usuario desactivado');
    }
    if (profile.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Solo administradores pueden realizar esta acción');
    }
}
function sanitizeText(s) {
    if (s == null)
        return null;
    const t = s.replace(/\u0000/g, '').trim();
    return t === '' ? null : t;
}
function normalizeWeightKg(v) {
    if (v === null || v === undefined)
        return null;
    const n = Number(v);
    if (Number.isNaN(n) || n < 0 || n > 200)
        return null;
    return n;
}
// ─────────────────────────────────────────────────────────────────────────────
// USERS — solo admins pueden gestionar usuarios
// ─────────────────────────────────────────────────────────────────────────────
exports.createUser = regionalFunctions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Debe iniciar sesión');
    }
    await requireAdmin(context.auth);
    const { email, password, first_name, last_name, role } = data;
    if (!email || !password || !first_name || !last_name || !role) {
        throw new functions.https.HttpsError('invalid-argument', 'Faltan campos requeridos');
    }
    if (role !== 'admin' && role !== 'staff') {
        throw new functions.https.HttpsError('invalid-argument', 'Rol inválido');
    }
    if (password.length < 8) {
        throw new functions.https.HttpsError('invalid-argument', 'La contraseña debe tener al menos 8 caracteres');
    }
    const userRecord = await admin.auth().createUser({ email, password });
    const nowIso = new Date().toISOString();
    await db.collection('profiles').doc(userRecord.uid).set({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.trim().toLowerCase(),
        role,
        is_active: true,
        created_at: nowIso,
        updated_at: nowIso,
    });
    // Auditoría
    await db.collection('audit_log').add({
        table_name: 'profiles',
        record_id: userRecord.uid,
        action: 'INSERT',
        old_values: null,
        new_values: { email, role, created_by: context.auth.uid },
        performed_by: context.auth.uid,
        performed_at: nowIso,
    });
    return { uid: userRecord.uid, email: userRecord.email };
});
exports.updateUser = regionalFunctions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Debe iniciar sesión');
    }
    await requireAdmin(context.auth);
    const { uid, first_name, last_name, email, role, is_active } = data;
    if (!uid) {
        throw new functions.https.HttpsError('invalid-argument', 'UID es requerido');
    }
    // Prevenir que un admin se desactive a sí mismo
    if (uid === context.auth.uid && is_active === false) {
        throw new functions.https.HttpsError('permission-denied', 'No puedes desactivarte a ti mismo');
    }
    if (role && role !== 'admin' && role !== 'staff') {
        throw new functions.https.HttpsError('invalid-argument', 'Rol inválido');
    }
    const updateData = { updated_at: new Date().toISOString() };
    if (first_name !== undefined)
        updateData.first_name = first_name.trim();
    if (last_name !== undefined)
        updateData.last_name = last_name.trim();
    if (email !== undefined)
        updateData.email = email.trim().toLowerCase();
    if (role !== undefined)
        updateData.role = role;
    if (is_active !== undefined)
        updateData.is_active = is_active;
    const profileRef = db.collection('profiles').doc(uid);
    const beforeSnap = await profileRef.get();
    const beforeData = beforeSnap.exists ? beforeSnap.data() : null;
    await profileRef.update(updateData);
    // Auditoría
    await db.collection('audit_log').add({
        table_name: 'profiles',
        record_id: uid,
        action: 'UPDATE',
        old_values: beforeData,
        new_values: updateData,
        performed_by: context.auth.uid,
        performed_at: new Date().toISOString(),
    });
    return { success: true };
});
exports.deleteUser = regionalFunctions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Debe iniciar sesión');
    }
    await requireAdmin(context.auth);
    const { uid } = data;
    if (!uid) {
        throw new functions.https.HttpsError('invalid-argument', 'UID es requerido');
    }
    // Prevenir que un admin se elimine a sí mismo
    if (uid === context.auth.uid) {
        throw new functions.https.HttpsError('permission-denied', 'No puedes eliminarte a ti mismo');
    }
    const profileRef = db.collection('profiles').doc(uid);
    const profileSnap = await profileRef.get();
    const profileData = profileSnap.exists ? profileSnap.data() : null;
    // Desactivar usuario en lugar de borrar (para no perder historial de adopciones)
    await profileRef.update({
        is_active: false,
        email: `[deleted_${Date.now()}]_${profileData?.email ?? ''}`,
        updated_at: new Date().toISOString(),
    });
    // Auditoría
    await db.collection('audit_log').add({
        table_name: 'profiles',
        record_id: uid,
        action: 'UPDATE',
        old_values: profileData,
        new_values: { is_active: false, email: 'soft_deleted' },
        performed_by: context.auth.uid,
        performed_at: new Date().toISOString(),
    });
    return { success: true };
});
// ─────────────────────────────────────────────────────────────────────────────
// PETS — solo admins pueden crear/editar/eliminar mascotas
// ─────────────────────────────────────────────────────────────────────────────
exports.createPet = regionalFunctions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Debe iniciar sesión');
    }
    await requireAdmin(context.auth);
    const petData = data;
    // Validaciones de campos
    const name = sanitizeText(petData.name);
    if (!name) {
        throw new functions.https.HttpsError('invalid-argument', 'El nombre es requerido');
    }
    const species = petData.species;
    if (species !== 'dog' && species !== 'cat') {
        throw new functions.https.HttpsError('invalid-argument', 'Species debe ser dog o cat');
    }
    const gender = petData.gender;
    if (gender !== 'male' && gender !== 'female') {
        throw new functions.https.HttpsError('invalid-argument', 'Gender debe ser male o female');
    }
    const age_months = Number(petData.age_months);
    if (Number.isNaN(age_months) || age_months < 0 || age_months > 240) {
        throw new functions.https.HttpsError('invalid-argument', 'Edad en meses inválida');
    }
    const uid = context.auth.uid;
    const petRef = db.collection('pets').doc();
    const now = new Date().toISOString();
    const todayDate = now.slice(0, 10);
    const validated = {
        name,
        species,
        breed: sanitizeText(petData.breed) ?? null,
        age_months,
        gender,
        size: ['small', 'medium', 'large', 'xlarge'].includes(String(petData.size))
            ? String(petData.size)
            : null,
        color: sanitizeText(petData.color) ?? null,
        contact_phone: sanitizeText(petData.contact_phone) ?? null,
        weight_kg: normalizeWeightKg(petData.weight_kg),
        sterilized: Boolean(petData.sterilized),
        vaccinated: Boolean(petData.vaccinated),
        dewormed: Boolean(petData.dewormed),
        microchip: Boolean(petData.microchip),
        health_notes: sanitizeText(petData.health_notes) ?? null,
        personality: sanitizeText(petData.personality) ?? null,
        story: sanitizeText(petData.story) ?? null,
        good_with_kids: petData.good_with_kids != null ? Boolean(petData.good_with_kids) : null,
        good_with_dogs: petData.good_with_dogs != null ? Boolean(petData.good_with_dogs) : null,
        good_with_cats: petData.good_with_cats != null ? Boolean(petData.good_with_cats) : null,
        special_needs: sanitizeText(petData.special_needs) ?? null,
        status: ['available', 'in_process', 'adopted'].includes(String(petData.status))
            ? String(petData.status)
            : 'available',
        photo_urls: Array.isArray(petData.photo_urls) ? petData.photo_urls.filter((u) => typeof u === 'string') : [],
        drive_folder_id: sanitizeText(petData.drive_folder_id) ?? null,
        intake_date: petData.intake_date?.trim() || todayDate,
        adopted_date: null,
        created_by: uid,
        updated_by: null,
        created_at: now,
        updated_at: now,
    };
    await petRef.set(validated);
    // Auditoría
    await db.collection('audit_log').add({
        table_name: 'pets',
        record_id: petRef.id,
        action: 'INSERT',
        old_values: null,
        new_values: validated,
        performed_by: uid,
        performed_at: now,
    });
    return { id: petRef.id };
});
exports.updatePet = regionalFunctions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Debe iniciar sesión');
    }
    await requireAdmin(context.auth);
    const { id, ...updates } = data;
    if (!id) {
        throw new functions.https.HttpsError('invalid-argument', 'ID de mascota es requerido');
    }
    const petRef = db.collection('pets').doc(id);
    const petSnap = await petRef.get();
    if (!petSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Mascota no encontrada');
    }
    const existing = petSnap.data();
    const updateData = {};
    if (updates.name !== undefined) {
        const v = sanitizeText(updates.name);
        if (!v)
            throw new functions.https.HttpsError('invalid-argument', 'El nombre no puede estar vacío');
        updateData.name = v;
    }
    if (updates.species !== undefined) {
        if (updates.species !== 'dog' && updates.species !== 'cat') {
            throw new functions.https.HttpsError('invalid-argument', 'Species inválido');
        }
        updateData.species = updates.species;
    }
    if (updates.breed !== undefined)
        updateData.breed = sanitizeText(updates.breed) ?? null;
    if (updates.age_months !== undefined) {
        const v = Number(updates.age_months);
        if (Number.isNaN(v) || v < 0 || v > 240) {
            throw new functions.https.HttpsError('invalid-argument', 'Edad en meses inválida');
        }
        updateData.age_months = v;
    }
    if (updates.gender !== undefined) {
        if (updates.gender !== 'male' && updates.gender !== 'female') {
            throw new functions.https.HttpsError('invalid-argument', 'Gender inválido');
        }
        updateData.gender = updates.gender;
    }
    if (updates.size !== undefined) {
        if (updates.size && !['small', 'medium', 'large', 'xlarge'].includes(updates.size)) {
            throw new functions.https.HttpsError('invalid-argument', 'Size inválido');
        }
        updateData.size = updates.size || null;
    }
    if (updates.color !== undefined)
        updateData.color = sanitizeText(updates.color) ?? null;
    if (updates.contact_phone !== undefined)
        updateData.contact_phone = sanitizeText(updates.contact_phone) ?? null;
    if (updates.weight_kg !== undefined)
        updateData.weight_kg = normalizeWeightKg(updates.weight_kg);
    if (updates.sterilized !== undefined)
        updateData.sterilized = Boolean(updates.sterilized);
    if (updates.vaccinated !== undefined)
        updateData.vaccinated = Boolean(updates.vaccinated);
    if (updates.dewormed !== undefined)
        updateData.dewormed = Boolean(updates.dewormed);
    if (updates.microchip !== undefined)
        updateData.microchip = Boolean(updates.microchip);
    if (updates.health_notes !== undefined)
        updateData.health_notes = sanitizeText(updates.health_notes) ?? null;
    if (updates.personality !== undefined)
        updateData.personality = sanitizeText(updates.personality) ?? null;
    if (updates.story !== undefined)
        updateData.story = sanitizeText(updates.story) ?? null;
    if (updates.good_with_kids !== undefined)
        updateData.good_with_kids = updates.good_with_kids != null ? Boolean(updates.good_with_kids) : null;
    if (updates.good_with_dogs !== undefined)
        updateData.good_with_dogs = updates.good_with_dogs != null ? Boolean(updates.good_with_dogs) : null;
    if (updates.good_with_cats !== undefined)
        updateData.good_with_cats = updates.good_with_cats != null ? Boolean(updates.good_with_cats) : null;
    if (updates.special_needs !== undefined)
        updateData.special_needs = sanitizeText(updates.special_needs) ?? null;
    if (updates.status !== undefined) {
        if (!['available', 'in_process', 'adopted'].includes(updates.status)) {
            throw new functions.https.HttpsError('invalid-argument', 'Status inválido');
        }
        updateData.status = updates.status;
    }
    if (updates.photo_urls !== undefined) {
        if (!Array.isArray(updates.photo_urls)) {
            throw new functions.https.HttpsError('invalid-argument', 'photo_urls debe ser array');
        }
        updateData.photo_urls = updates.photo_urls.filter((u) => typeof u === 'string');
    }
    if (updates.drive_folder_id !== undefined)
        updateData.drive_folder_id = sanitizeText(updates.drive_folder_id) ?? null;
    if (updates.intake_date !== undefined)
        updateData.intake_date = updates.intake_date?.trim() || '';
    if (updates.updated_by !== undefined)
        updateData.updated_by = updates.updated_by;
    updateData.updated_at = new Date().toISOString();
    await petRef.update(updateData);
    // Auditoría
    await db.collection('audit_log').add({
        table_name: 'pets',
        record_id: id,
        action: 'UPDATE',
        old_values: existing,
        new_values: updateData,
        performed_by: context.auth.uid,
        performed_at: new Date().toISOString(),
    });
    return { success: true };
});
exports.deletePet = regionalFunctions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Debe iniciar sesión');
    }
    await requireAdmin(context.auth);
    const { id } = data;
    if (!id) {
        throw new functions.https.HttpsError('invalid-argument', 'ID de mascota es requerido');
    }
    const petRef = db.collection('pets').doc(id);
    const petSnap = await petRef.get();
    if (!petSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Mascota no encontrada');
    }
    const petData = petSnap.data();
    // Eliminar fotos asociadas
    if (petData?.photo_urls?.length) {
        for (const url of petData.photo_urls) {
            try {
                const filePath = extractPathFromUrl(url);
                if (filePath)
                    await storage.bucket().file(filePath).delete();
            }
            catch (e) {
                console.error(`Error al eliminar foto: ${url}`, e);
            }
        }
    }
    // Auditoría antes de borrar
    await db.collection('audit_log').add({
        table_name: 'pets',
        record_id: id,
        action: 'DELETE',
        old_values: petData,
        new_values: null,
        performed_by: context.auth.uid,
        performed_at: new Date().toISOString(),
    });
    await petRef.delete();
    return { success: true };
});
// ─────────────────────────────────────────────────────────────────────────────
// ADOPTION REQUESTS — público (crear) pero solo admins pueden modificar status
// ─────────────────────────────────────────────────────────────────────────────
exports.createAdoptionRequest = regionalFunctions.https.onCall(async (data, context) => {
    // NO requiere autenticación — formulario público
    // PERO sí validamos que los datos no sean spam (ver más abajo)
    const requestData = data;
    // Validaciones de campos requeridos
    const required = ['pet_id', 'full_name', 'email', 'phone', 'id_number', 'address', 'city', 'motivation'];
    for (const field of required) {
        if (!requestData[field]) {
            throw new functions.https.HttpsError('invalid-argument', `Campo requerido faltante: ${field}`);
        }
    }
    // Validar que la mascota existe y está disponible
    const petRef = db.collection('pets').doc(requestData.pet_id);
    const petSnap = await petRef.get();
    if (!petSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Mascota no encontrada');
    }
    const petData = petSnap.data();
    if (petData?.status !== 'available') {
        throw new functions.https.HttpsError('failed-precondition', 'Esta mascota ya no está disponible para adopción');
    }
    const now = new Date().toISOString();
    const validated = {
        pet_id: requestData.pet_id.trim(),
        full_name: requestData.full_name.trim(),
        email: requestData.email.trim().toLowerCase(),
        phone: requestData.phone.trim(),
        id_number: requestData.id_number.trim(),
        address: requestData.address.trim(),
        city: requestData.city.trim(),
        housing_type: ['house', 'apartment', 'farm', 'other'].includes(String(requestData.housing_type))
            ? String(requestData.housing_type)
            : null,
        has_yard: requestData.has_yard != null ? Boolean(requestData.has_yard) : null,
        has_other_pets: requestData.has_other_pets != null ? Boolean(requestData.has_other_pets) : null,
        other_pets_description: requestData.other_pets_description
            ? requestData.other_pets_description.trim() || null
            : null,
        has_children: requestData.has_children != null ? Boolean(requestData.has_children) : null,
        children_ages: requestData.children_ages
            ? requestData.children_ages.trim() || null
            : null,
        motivation: requestData.motivation.trim(),
        experience_with_pets: requestData.experience_with_pets
            ? requestData.experience_with_pets.trim() || null
            : null,
        work_schedule: requestData.work_schedule
            ? requestData.work_schedule.trim() || null
            : null,
        status: 'pending',
        admin_notes: null,
        reviewed_by: null,
        reviewed_at: null,
        created_at: now,
    };
    const requestRef = db.collection('adoption_requests').doc();
    await requestRef.set({ ...validated, id: requestRef.id });
    // Actualizar estado de la mascota a in_process
    await petRef.update({
        status: 'in_process',
        updated_at: now,
    });
    return { id: requestRef.id };
});
exports.updateAdoptionRequest = regionalFunctions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Debe iniciar sesión');
    }
    await requireAdmin(context.auth);
    const { id, admin_notes, status } = data;
    if (!id) {
        throw new functions.https.HttpsError('invalid-argument', 'ID de solicitud es requerido');
    }
    if (!status && admin_notes === undefined) {
        throw new functions.https.HttpsError('invalid-argument', 'Debe proporcionar status o admin_notes');
    }
    if (status && !['pending', 'reviewing', 'approved', 'rejected'].includes(status)) {
        throw new functions.https.HttpsError('invalid-argument', 'Status inválido');
    }
    const requestRef = db.collection('adoption_requests').doc(id);
    const requestSnap = await requestRef.get();
    if (!requestSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Solicitud no encontrada');
    }
    const existing = requestSnap.data();
    const now = new Date().toISOString();
    const updateData = {
        reviewed_by: context.auth.uid,
        reviewed_at: now,
    };
    if (admin_notes !== undefined)
        updateData.admin_notes = admin_notes;
    if (status !== undefined)
        updateData.status = status;
    await requestRef.update(updateData);
    // Si cambió el status, actualizar también la mascota
    if (status && status !== existing?.status) {
        const petRef = db.collection('pets').doc(existing?.pet_id);
        const newPetStatus = status === 'approved' ? 'adopted' : 'available';
        await petRef.update({
            status: newPetStatus,
            adopted_date: status === 'approved' ? now : null,
            updated_at: now,
        });
    }
    // Auditoría
    await db.collection('audit_log').add({
        table_name: 'adoption_requests',
        record_id: id,
        action: 'UPDATE',
        old_values: existing,
        new_values: updateData,
        performed_by: context.auth.uid,
        performed_at: now,
    });
    return { success: true };
});
exports.deleteAdoptionRequest = regionalFunctions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Debe iniciar sesión');
    }
    await requireAdmin(context.auth);
    const { id } = data;
    if (!id) {
        throw new functions.https.HttpsError('invalid-argument', 'ID de solicitud es requerido');
    }
    const requestRef = db.collection('adoption_requests').doc(id);
    const requestSnap = await requestRef.get();
    if (!requestSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Solicitud no encontrada');
    }
    const existing = requestSnap.data();
    // Auditoría antes de borrar
    await db.collection('audit_log').add({
        table_name: 'adoption_requests',
        record_id: id,
        action: 'DELETE',
        old_values: existing,
        new_values: null,
        performed_by: context.auth.uid,
        performed_at: new Date().toISOString(),
    });
    await requestRef.delete();
    return { success: true };
});
// ─────────────────────────────────────────────────────────────────────────────
// STORAGE — solo admins pueden subir/eliminar fotos de mascotas
// ─────────────────────────────────────────────────────────────────────────────
exports.uploadPetPhoto = regionalFunctions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Debe iniciar sesión');
    }
    await requireAdmin(context.auth);
    const { petId, photoDataUrl } = data;
    if (!petId || !photoDataUrl) {
        throw new functions.https.HttpsError('invalid-argument', 'petId y photoDataUrl son requeridos');
    }
    // Validar que la mascota existe
    const petRef = db.collection('pets').doc(petId);
    const petSnap = await petRef.get();
    if (!petSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Mascota no encontrada');
    }
    // Decodificar base64
    const matches = photoDataUrl.match(/^data:(image\/(jpeg|png));base64,(.+)$/);
    if (!matches) {
        throw new functions.https.HttpsError('invalid-argument', 'Formato de imagen inválido');
    }
    const mimeType = matches[1];
    const base64Data = matches[3];
    const buffer = Buffer.from(base64Data, 'base64');
    // Límite de 5MB
    if (buffer.length > 5 * 1024 * 1024) {
        throw new functions.https.HttpsError('invalid-argument', 'La imagen no puede superar los 5MB');
    }
    const ext = mimeType === 'image/png' ? 'png' : 'jpg';
    const filePath = `pet-photos/${petId}/${crypto.randomUUID()}.${ext}`;
    const downloadToken = crypto.randomUUID();
    const bucket = storage.bucket();
    await bucket.file(filePath).save(buffer, {
        metadata: {
            contentType: mimeType,
            cacheControl: '31536000',
            metadata: {
                firebaseStorageDownloadTokens: downloadToken,
            },
        },
    });
    const encodedPath = encodeURIComponent(filePath);
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;
    // Agregar URL a la mascota
    const existingUrls = petSnap.data()?.photo_urls ?? [];
    const newUrls = [...existingUrls, url];
    // Límite de 5 fotos por mascota
    if (newUrls.length > 5) {
        throw new functions.https.HttpsError('invalid-argument', 'Máximo 5 fotos por mascota');
    }
    await petRef.update({
        photo_urls: newUrls,
        updated_at: new Date().toISOString(),
    });
    return { url };
});
exports.deletePetPhoto = regionalFunctions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Debe iniciar sesión');
    }
    await requireAdmin(context.auth);
    const { petId, photoUrl } = data;
    if (!petId || !photoUrl) {
        throw new functions.https.HttpsError('invalid-argument', 'petId y photoUrl son requeridos');
    }
    const petRef = db.collection('pets').doc(petId);
    const petSnap = await petRef.get();
    if (!petSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Mascota no encontrada');
    }
    const existingUrls = petSnap.data()?.photo_urls ?? [];
    if (!existingUrls.includes(photoUrl)) {
        throw new functions.https.HttpsError('not-found', 'Foto no encontrada en esta mascota');
    }
    // Eliminar del storage
    const filePath = extractPathFromUrl(photoUrl);
    if (filePath) {
        try {
            await storage.bucket().file(filePath).delete();
        }
        catch (e) {
            console.warn('No se pudo eliminar archivo del storage:', e);
        }
    }
    // Actualizar array en Firestore
    await petRef.update({
        photo_urls: existingUrls.filter((u) => u !== photoUrl),
        updated_at: new Date().toISOString(),
    });
    return { success: true };
});
// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function extractPathFromUrl(url) {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname.includes('firebasestorage.googleapis.com')) {
            const pathMatch = urlObj.pathname.match(/v2\/.*\/o\/(.+?)(?:\?|$)/);
            return pathMatch ? decodeURIComponent(pathMatch[1]) : null;
        }
    }
    catch (e) { /* ignore */ }
    return null;
}
//# sourceMappingURL=index.js.map