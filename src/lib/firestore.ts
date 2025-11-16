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
  Timestamp,
  writeBatch
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
    await updateDoc(doc(db, 'institutions', id), {
      ...data,
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const deleteInstitution = async (id: string) => {
  try {
    const batch = writeBatch(db);
    
    // Delete institution reference
    batch.delete(doc(db, 'institutions', id));

    // Delete related faculties
    const facultiesQuery = query(
      collection(db, 'faculties'),
      where('institutionId', '==', id)
    );
    const facultiesSnapshot = await getDocs(facultiesQuery);
    facultiesSnapshot.forEach((facultyDoc) => batch.delete(facultyDoc.ref));

    // Delete related courses
    const coursesQuery = query(
      collection(db, 'courses'),
      where('institutionId', '==', id)
    );
    const coursesSnapshot = await getDocs(coursesQuery);
    coursesSnapshot.forEach((courseDoc) => batch.delete(courseDoc.ref));

    // Delete related applications
    const applicationsQuery = query(
      collection(db, 'applications'),
      where('institutionId', '==', id)
    );
    const applicationsSnapshot = await getDocs(applicationsQuery);
    applicationsSnapshot.forEach((applicationDoc) => batch.delete(applicationDoc.ref));

    await batch.commit();
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

export const getAllCourses = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'courses'));
    const courses = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: courses };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateCourse = async (id: string, data: any) => {
  try {
    await updateDoc(doc(db, 'courses', id), {
      ...data,
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const deleteCourse = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'courses', id));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Faculty operations
export const createFaculty = async (data: any) => {
  try {
    const docRef = await addDoc(collection(db, 'faculties'), {
      ...data,
      createdAt: Timestamp.now()
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getFacultiesByInstitution = async (institutionId: string) => {
  try {
    const q = query(
      collection(db, 'faculties'),
      where('institutionId', '==', institutionId),
      orderBy('createdAt', 'asc')
    );
    const querySnapshot = await getDocs(q);
    const faculties = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: faculties };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getAllFaculties = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'faculties'));
    const faculties = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: faculties };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateFaculty = async (id: string, data: any) => {
  try {
    await updateDoc(doc(db, 'faculties', id), {
      ...data,
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const deleteFaculty = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'faculties', id));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateStudentGraduationStatus = async (studentId: string, graduated: boolean) => {
  try {
    await updateDoc(doc(db, 'users', studentId), {
      'profile.graduated': graduated,
      'profile.graduatedAt': graduated ? Timestamp.now() : null
    });
    return { success: true };
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
      isPublished: false,
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

export const publishApplicationDecision = async (id: string) => {
  try {
    await updateDoc(doc(db, 'applications', id), {
      isPublished: true,
      publishedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const bulkPublishApplications = async (ids: string[]) => {
  try {
    const batch = writeBatch(db);
    ids.forEach((id) => {
      batch.update(doc(db, 'applications', id), {
        isPublished: true,
        publishedAt: Timestamp.now()
      });
    });
    await batch.commit();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getAllApplications = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'applications'));
    const applications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: applications };
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

export const getAllJobApplications = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'jobApplications'));
    const applications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: applications };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Profile operations
export const updateInstitutionProfile = async (uid: string, profileData: any) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      profile: profileData,
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateCompanyProfile = async (uid: string, profileData: any) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      profile: profileData,
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateStudentDocuments = async (uid: string, data: any) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      documents: {
        transcriptUrl: data.transcriptUrl,
        certificateUrls: data.certificateUrls,
        academicPerformance: data.academicPerformance,
        skills: data.skills,
        workExperience: data.workExperience
      },
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const deleteCompanyAccount = async (companyId: string) => {
  try {
    const batch = writeBatch(db);

    // Delete company jobs
    const jobsQuery = query(
      collection(db, 'jobs'),
      where('companyId', '==', companyId)
    );
    const jobsSnapshot = await getDocs(jobsQuery);
    jobsSnapshot.forEach((jobDoc) => batch.delete(jobDoc.ref));

    // Delete job applications related to company
    const applicationsQuery = query(
      collection(db, 'jobApplications'),
      where('companyId', '==', companyId)
    );
    const applicationsSnapshot = await getDocs(applicationsQuery);
    applicationsSnapshot.forEach((appDoc) => batch.delete(appDoc.ref));

    // Delete user record
    batch.delete(doc(db, 'users', companyId));

    await batch.commit();

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
