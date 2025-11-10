// Firestore database helper functions
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Institution operations
export const createInstitution = async (data: any) => {
  try {
    const docRef = await addDoc(collection(db, 'institutions'), {
      ...data,
      createdAt: Timestamp.now()
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateInstitution = async (id: string, data: any) => {
  try {
    await updateDoc(doc(db, 'institutions', id), data);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const deleteInstitution = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'institutions', id));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getInstitutions = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'institutions'));
    const institutions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: institutions };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Course operations
export const createCourse = async (data: any) => {
  try {
    const docRef = await addDoc(collection(db, 'courses'), {
      ...data,
      createdAt: Timestamp.now()
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getCoursesByInstitution = async (institutionId: string) => {
  try {
    const q = query(
      collection(db, 'courses'), 
      where('institutionId', '==', institutionId)
    );
    const querySnapshot = await getDocs(q);
    const courses = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: courses };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Application operations
export const createApplication = async (data: any) => {
  try {
    // Check if student already has 2 applications for this institution
    const q = query(
      collection(db, 'applications'),
      where('studentId', '==', data.studentId),
      where('institutionId', '==', data.institutionId)
    );
    const existingApps = await getDocs(q);
    
    if (existingApps.size >= 2) {
      return { success: false, error: 'Maximum 2 applications per institution' };
    }

    const docRef = await addDoc(collection(db, 'applications'), {
      ...data,
      status: 'pending',
      createdAt: Timestamp.now()
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getApplicationsByStudent = async (studentId: string) => {
  try {
    const q = query(
      collection(db, 'applications'),
      where('studentId', '==', studentId)
    );
    const querySnapshot = await getDocs(q);
    const applications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: applications };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateApplicationStatus = async (id: string, status: string, institutionId: string, studentId: string) => {
  try {
    await updateDoc(doc(db, 'applications', id), { 
      status,
      updatedAt: Timestamp.now()
    });

    // If admitted, check if student is admitted elsewhere
    if (status === 'admitted') {
      const q = query(
        collection(db, 'applications'),
        where('studentId', '==', studentId),
        where('status', '==', 'admitted')
      );
      const admittedApps = await getDocs(q);
      
      // Student needs to select one institution if admitted to multiple
      if (admittedApps.size > 1) {
        // This will be handled by student selection
      }
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Job posting operations
export const createJobPosting = async (data: any) => {
  try {
    const docRef = await addDoc(collection(db, 'jobs'), {
      ...data,
      createdAt: Timestamp.now(),
      status: 'active'
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getJobPostings = async () => {
  try {
    const q = query(
      collection(db, 'jobs'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const jobs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: jobs };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Job application operations
export const applyForJob = async (data: any) => {
  try {
    const docRef = await addDoc(collection(db, 'jobApplications'), {
      ...data,
      status: 'pending',
      createdAt: Timestamp.now()
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getJobApplicationsByCompany = async (companyId: string, jobId: string) => {
  try {
    const q = query(
      collection(db, 'jobApplications'),
      where('companyId', '==', companyId),
      where('jobId', '==', jobId)
    );
    const querySnapshot = await getDocs(q);
    const applications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: applications };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
