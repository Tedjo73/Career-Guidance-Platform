import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { BookOpen, Users, Plus, CheckCircle, XCircle, Clock, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  createCourse, 
  getCoursesByInstitution, 
  updateApplicationStatus, 
  createFaculty, 
  getFacultiesByInstitution, 
  deleteFaculty, 
  deleteCourse, 
  publishApplicationDecision, 
  updateInstitutionProfile, 
  updateInstitution,
  updateStudentGraduationStatus
} from '../lib/firestore';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner@2.0.3';

export const InstituteDashboard: React.FC = () => {
  const { user, userProfile, setUserProfile } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddFaculty, setShowAddFaculty] = useState(false);
  const [institutionId, setInstitutionId] = useState('');
  const [institutionMeta, setInstitutionMeta] = useState<any | null>(null);

  // Course form state
  const [courseName, setCourseName] = useState('');
  const [courseFaculty, setCourseFaculty] = useState('');
  const [courseDuration, setCourseDuration] = useState('');
  const [courseRequirements, setCourseRequirements] = useState('');
  const [newFaculty, setNewFaculty] = useState('');

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    institutionName: '',
    institutionType: '',
    contactPerson: '',
    phone: '',
    address: '',
    website: '',
    location: '',
    email: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
  const [deletingFacultyId, setDeletingFacultyId] = useState<string | null>(null);
  const [updatingGraduateId, setUpdatingGraduateId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (!userProfile) return;
    setProfileForm((prev) => ({
      institutionName: userProfile.profile?.institutionName || institutionMeta?.name || prev.institutionName || '',
      institutionType: userProfile.profile?.institutionType || institutionMeta?.type || prev.institutionType || '',
      contactPerson: userProfile.profile?.contactPerson || prev.contactPerson || '',
      phone: userProfile.profile?.phone || prev.phone || '',
      address: userProfile.profile?.address || institutionMeta?.address || prev.address || '',
      website: userProfile.profile?.website || prev.website || '',
      location: userProfile.profile?.location || institutionMeta?.location || prev.location || '',
      email: userProfile.email || user?.email || prev.email || ''
    }));
  }, [userProfile, institutionMeta, user]);

  const loadData = async () => {
    if (!user) return;

    // Find institution ID for this user
    const instQuery = query(
      collection(db, 'institutions'),
      where('email', '==', user.email)
    );
    const instSnapshot = await getDocs(instQuery);
    
    if (!instSnapshot.empty) {
      const institutionDoc = instSnapshot.docs[0];
      const instId = institutionDoc.id;
      const instData = institutionDoc.data();
      setInstitutionId(instId);
      setInstitutionMeta(instData);

      // Load faculties
      const facultiesResult = await getFacultiesByInstitution(instId);
      if (facultiesResult.success) {
        setFaculties(facultiesResult.data);
        if (!courseFaculty && facultiesResult.data.length) {
          setCourseFaculty(facultiesResult.data[0].name);
        }
      } else {
        setFaculties([]);
      }

      // Load courses
      const coursesResult = await getCoursesByInstitution(instId);
      if (coursesResult.success) {
        setCourses(coursesResult.data);
      }

      // Load applications for this institution
      const appsQuery = query(
        collection(db, 'applications'),
        where('institutionId', '==', instId)
      );
      const appsSnapshot = await getDocs(appsQuery);
      const appsData = await Promise.all(
        appsSnapshot.docs.map(async (appDoc) => {
          const appData = appDoc.data();
          
          // Get student info
          const studentDoc = await getDoc(doc(db, 'users', appData.studentId));
          const studentData = studentDoc.exists() ? studentDoc.data() : null;

          return {
            id: appDoc.id,
            ...appData,
            studentName: studentData?.profile?.name || 'Unknown',
            studentEmail: studentData?.email || 'Unknown',
            studentGraduated: studentData?.profile?.graduated || false
          };
        })
      );
      setApplications(appsData);
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institutionId) {
      toast.error('Institution not loaded yet. Please try again shortly.');
      return;
    }
    if (!courseFaculty) {
      toast.error('Please select a faculty');
      return;
    }

    const result = await createCourse({
      institutionId,
      name: courseName,
      faculty: courseFaculty,
      duration: courseDuration,
      requirements: courseRequirements,
      status: 'active'
    });

    if (result.success) {
      toast.success('Course added successfully');
      setShowAddCourse(false);
      setCourseName('');
      setCourseFaculty(faculties[0]?.name || '');
      setCourseDuration('');
      setCourseRequirements('');
      loadData();
    } else {
      toast.error('Failed to add course');
    }
  };

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institutionId) {
      toast.error('Institution not loaded yet. Please try again.');
      return;
    }
    const trimmedName = newFaculty.trim();
    if (!trimmedName) {
      toast.error('Faculty name is required');
      return;
    }
    if (faculties.some((faculty: any) => faculty.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast.error('Faculty already exists');
      return;
    }

    const result = await createFaculty({
      institutionId,
      name: trimmedName
    });

    if (result.success) {
      toast.success('Faculty added successfully');
      setNewFaculty('');
      setShowAddFaculty(false);
      loadData();
    } else {
      toast.error(result.error || 'Failed to add faculty');
    }
  };

  const handleDeleteFacultyEntry = async (facultyId: string) => {
    if (!facultyId) return;
    setDeletingFacultyId(facultyId);
    const result = await deleteFaculty(facultyId);
    if (result.success) {
      toast.success('Faculty removed');
      await loadData();
    } else {
      toast.error(result.error || 'Failed to delete faculty');
    }
    setDeletingFacultyId(null);
  };

  const handleUpdateApplicationStatus = async (applicationId: string, newStatus: string, studentId: string) => {
    const result = await updateApplicationStatus(applicationId, newStatus, institutionId, studentId);
    
    if (result.success) {
      toast.success(`Application ${newStatus}`);
      loadData();
    } else {
      toast.error('Failed to update application');
    }
  };

  const handlePublishApplication = async (applicationId: string) => {
    setPublishingId(applicationId);
    const result = await publishApplicationDecision(applicationId);
    if (result.success) {
      toast.success('Admission published');
      loadData();
    } else {
      toast.error(result.error || 'Failed to publish admission');
    }
    setPublishingId(null);
  };

  const handleDeleteCourse = async (courseId: string) => {
    setDeletingCourseId(courseId);
    const result = await deleteCourse(courseId);
    if (result.success) {
      toast.success('Course removed');
      await loadData();
    } else {
      toast.error(result.error || 'Failed to remove course');
    }
    setDeletingCourseId(null);
  };

  const handleGraduateStudent = async (studentId: string) => {
    if (!studentId) return;
    setUpdatingGraduateId(studentId);
    const result = await updateStudentGraduationStatus(studentId, true);
    if (result.success) {
      toast.success('Student promoted to graduate');
      await loadData();
    } else {
      toast.error(result.error || 'Failed to promote student');
    }
    setUpdatingGraduateId(null);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSavingProfile(true);
    try {
      const updatedProfile = {
        ...userProfile?.profile,
        institutionName: profileForm.institutionName,
        institutionType: profileForm.institutionType,
        contactPerson: profileForm.contactPerson,
        phone: profileForm.phone,
        address: profileForm.address,
        website: profileForm.website,
        location: profileForm.location
      };

      const [profileResult, institutionResult] = await Promise.all([
        updateInstitutionProfile(user.uid, updatedProfile),
        institutionId
          ? updateInstitution(institutionId, {
              name: profileForm.institutionName,
              type: profileForm.institutionType,
              email: profileForm.email,
              location: profileForm.location
            })
          : Promise.resolve({ success: true })
      ]);

      if (profileResult.success && institutionResult.success) {
        toast.success('Profile updated successfully');
        setUserProfile((prev) =>
          prev
            ? {
                ...prev,
                profile: updatedProfile
              }
            : prev
        );
        loadData();
      } else {
        toast.error(profileResult.error || institutionResult.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Unexpected error updating profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const getApplicationsByStatus = (status: string) => {
    return applications.filter((app: any) => app.status === status);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Institution Dashboard</h1>
        <p className="text-gray-600">
          {userProfile?.profile?.institutionName || 'Manage your institution'}
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-gray-900">{courses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Pending Applications</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-gray-900">{getApplicationsByStatus('pending').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Admitted Students</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-gray-900">{getApplicationsByStatus('admitted').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Faculties</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-gray-900">{faculties.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="faculties">Faculties</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Manage Courses</CardTitle>
                  <CardDescription>Add and manage courses offered by your institution</CardDescription>
                </div>
                <Dialog open={showAddCourse} onOpenChange={setShowAddCourse}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Course
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Course</DialogTitle>
                      <DialogDescription>Enter the course details</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddCourse} className="space-y-4">
                      <div>
                        <Label htmlFor="course-name">Course Name</Label>
                        <Input
                          id="course-name"
                          value={courseName}
                          onChange={(e) => setCourseName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="course-faculty">Faculty</Label>
                        <Select value={courseFaculty} onValueChange={setCourseFaculty}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select faculty" />
                          </SelectTrigger>
                          <SelectContent>
                            {faculties.map((faculty: any) => (
                              <SelectItem key={faculty.id} value={faculty.name}>
                                {faculty.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="course-duration">Duration</Label>
                        <Input
                          id="course-duration"
                          placeholder="e.g., 4 years"
                          value={courseDuration}
                          onChange={(e) => setCourseDuration(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="course-requirements">Entry Requirements</Label>
                        <Input
                          id="course-requirements"
                          placeholder="e.g., High School Certificate with..."
                          value={courseRequirements}
                          onChange={(e) => setCourseRequirements(e.target.value)}
                        />
                      </div>
                      <Button type="submit" className="w-full">Add Course</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Faculty</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Applications</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => {
                    const courseApps = applications.filter((app: any) => app.courseId === course.id);
                    return (
                      <TableRow key={course.id}>
                        <TableCell>{course.name}</TableCell>
                        <TableCell>{course.faculty}</TableCell>
                        <TableCell>{course.duration}</TableCell>
                        <TableCell>{courseApps.length}</TableCell>
                        <TableCell>
                          <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
                            {course.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteCourse(course.id)}
                            disabled={deletingCourseId === course.id}
                          >
                            {deletingCourseId === course.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-red-500" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faculties">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Manage Faculties</CardTitle>
                  <CardDescription>Add and manage faculties in your institution</CardDescription>
                </div>
                <Dialog open={showAddFaculty} onOpenChange={setShowAddFaculty}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Faculty
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Faculty</DialogTitle>
                      <DialogDescription>Enter the faculty name</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddFaculty} className="space-y-4">
                      <div>
                        <Label htmlFor="faculty-name">Faculty Name</Label>
                        <Input
                          id="faculty-name"
                          value={newFaculty}
                          onChange={(e) => setNewFaculty(e.target.value)}
                          placeholder="e.g., Faculty of Medicine"
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Add Faculty
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {faculties.map((faculty: any) => (
                  <Card key={faculty.id}>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                      <div>
                        <CardTitle className="text-lg">{faculty.name}</CardTitle>
                        <CardDescription>
                          {courses.filter((c: any) => c.faculty === faculty.name).length} courses
                        </CardDescription>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteFacultyEntry(faculty.id)}
                        disabled={deletingFacultyId === faculty.id}
                      >
                        {deletingFacultyId === faculty.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </CardHeader>
                  </Card>
                ))}
                {!faculties.length && (
                  <div className="text-sm text-gray-500 border border-dashed rounded-lg p-4">
                    No faculties yet. Add your first faculty to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Student Applications</CardTitle>
              <CardDescription>Review and manage student applications</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pending">
                <TabsList>
                  <TabsTrigger value="pending">
                    Pending ({getApplicationsByStatus('pending').length})
                  </TabsTrigger>
                  <TabsTrigger value="admitted">
                    Admitted ({getApplicationsByStatus('admitted').length})
                  </TabsTrigger>
                  <TabsTrigger value="rejected">
                    Rejected ({getApplicationsByStatus('rejected').length})
                  </TabsTrigger>
                  <TabsTrigger value="waiting">
                    Waiting List ({getApplicationsByStatus('waiting').length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Applied Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getApplicationsByStatus('pending').map((app: any) => (
                        <TableRow key={app.id}>
                          <TableCell>{app.studentName}</TableCell>
                          <TableCell>{app.studentEmail}</TableCell>
                          <TableCell>{app.courseName}</TableCell>
                          <TableCell>
                            {new Date(app.createdAt?.seconds * 1000).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleUpdateApplicationStatus(app.id, 'admitted', app.studentId)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Admit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateApplicationStatus(app.id, 'waiting', app.studentId)}
                              >
                                Waiting List
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleUpdateApplicationStatus(app.id, 'rejected', app.studentId)}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="admitted">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Published</TableHead>
                        <TableHead>Graduation</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getApplicationsByStatus('admitted').map((app: any) => (
                        <TableRow key={app.id}>
                          <TableCell>{app.studentName}</TableCell>
                          <TableCell>{app.studentEmail}</TableCell>
                          <TableCell>{app.courseName}</TableCell>
                          <TableCell>
                            <Badge variant={app.isPublished ? 'default' : 'secondary'}>
                              {app.isPublished ? 'Published' : 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={app.studentGraduated ? 'default' : 'secondary'}>
                              {app.studentGraduated ? 'Graduated' : 'In Progress'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                onClick={() => handlePublishApplication(app.id)}
                                disabled={app.isPublished || publishingId === app.id}
                              >
                                {publishingId === app.id && (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                )}
                                Publish
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateApplicationStatus(app.id, 'waiting', app.studentId)}
                              >
                                Move to Waiting
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleUpdateApplicationStatus(app.id, 'rejected', app.studentId)}
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                variant={app.studentGraduated ? 'outline' : 'default'}
                                onClick={() => handleGraduateStudent(app.studentId)}
                                disabled={app.studentGraduated || updatingGraduateId === app.studentId}
                              >
                                {updatingGraduateId === app.studentId ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                {app.studentGraduated ? 'Graduated' : 'Mark as Graduated'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="rejected">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Published</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getApplicationsByStatus('rejected').map((app: any) => (
                        <TableRow key={app.id}>
                          <TableCell>{app.studentName}</TableCell>
                          <TableCell>{app.studentEmail}</TableCell>
                          <TableCell>{app.courseName}</TableCell>
                          <TableCell>
                            <Badge variant={app.isPublished ? 'default' : 'secondary'}>
                              {app.isPublished ? 'Published' : 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                onClick={() => handlePublishApplication(app.id)}
                                disabled={app.isPublished || publishingId === app.id}
                              >
                                {publishingId === app.id && (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                )}
                                Publish
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateApplicationStatus(app.id, 'waiting', app.studentId)}
                              >
                                Move to Waiting
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateApplicationStatus(app.id, 'admitted', app.studentId)}
                              >
                                Admit
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="waiting">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Published</TableHead>
                        <TableHead>Graduation</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getApplicationsByStatus('waiting').map((app: any) => (
                        <TableRow key={app.id}>
                          <TableCell>{app.studentName}</TableCell>
                          <TableCell>{app.studentEmail}</TableCell>
                          <TableCell>{app.courseName}</TableCell>
                          <TableCell>
                            <Badge variant={app.isPublished ? 'default' : 'secondary'}>
                              {app.isPublished ? 'Published' : 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={app.studentGraduated ? 'default' : 'secondary'}>
                              {app.studentGraduated ? 'Graduated' : 'In Progress'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                onClick={() => handlePublishApplication(app.id)}
                                disabled={app.isPublished || publishingId === app.id}
                              >
                                {publishingId === app.id && (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                )}
                                Publish
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateApplicationStatus(app.id, 'admitted', app.studentId)}
                              >
                                Promote to Admitted
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleUpdateApplicationStatus(app.id, 'rejected', app.studentId)}
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                variant={app.studentGraduated ? 'outline' : 'default'}
                                onClick={() => handleGraduateStudent(app.studentId)}
                                disabled={app.studentGraduated || updatingGraduateId === app.studentId}
                              >
                                {updatingGraduateId === app.studentId ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                {app.studentGraduated ? 'Graduated' : 'Mark as Graduated'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Institution Profile</CardTitle>
              <CardDescription>Update your institution information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Institution Name</Label>
                  <Input value={userProfile?.profile?.institutionName || ''} disabled />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={userProfile?.email || ''} disabled />
                </div>
                <div>
                  <Label>Type</Label>
                  <Input value={userProfile?.profile?.institutionType || ''} disabled />
                </div>
                <div>
                  <Label>Contact Person</Label>
                  <Input placeholder="Name of contact person" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={userProfile?.profile?.phone || ''} />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input value={userProfile?.profile?.address || ''} />
                </div>
                <Button>Update Profile</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
