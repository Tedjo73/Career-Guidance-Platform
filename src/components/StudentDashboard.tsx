import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { BookOpen, Briefcase, FileText, Upload, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getInstitutions, getCoursesByInstitution, createApplication, getApplicationsByStudent, applyForJob, getJobPostings } from '../lib/firestore';
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner@2.0.3';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [courses, setCourses] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [transcript, setTranscript] = useState('');
  const [certificates, setCertificates] = useState('');
  const [multipleAdmissions, setMultipleAdmissions] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    // Load institutions
    const instResult = await getInstitutions();
    if (instResult.success) {
      setInstitutions(instResult.data);
    }

    // Load student applications
    const appResult = await getApplicationsByStudent(user.uid);
    if (appResult.success) {
      setApplications(appResult.data);
      
      // Check for multiple admissions
      const admitted = appResult.data.filter((app: any) => app.status === 'admitted');
      if (admitted.length > 1) {
        setMultipleAdmissions(admitted);
      }
    }

    // Load available jobs
    const jobsResult = await getJobPostings();
    if (jobsResult.success) {
      setJobs(jobsResult.data);
    }
  };

  const handleInstitutionChange = async (institutionId: string) => {
    setSelectedInstitution(institutionId);
    const coursesResult = await getCoursesByInstitution(institutionId);
    if (coursesResult.success) {
      setCourses(coursesResult.data);
    }
  };

  const handleApplyCourse = (course: any) => {
    setSelectedCourse(course);
    setShowApplyDialog(true);
  };

  const handleSubmitApplication = async () => {
    if (!user || !selectedCourse) return;

    const result = await createApplication({
      studentId: user.uid,
      courseId: selectedCourse.id,
      institutionId: selectedCourse.institutionId,
      courseName: selectedCourse.name,
      appliedAt: new Date()
    });

    if (result.success) {
      toast.success('Application submitted successfully');
      setShowApplyDialog(false);
      loadData();
    } else {
      toast.error(result.error || 'Failed to submit application');
    }
  };

  const handleSelectInstitution = async (applicationId: string, institutionId: string) => {
    if (!user) return;

    try {
      // Get all admitted applications for this student
      const admittedApps = applications.filter((app: any) => app.status === 'admitted');
      
      // Delete all other admitted applications
      for (const app of admittedApps) {
        if (app.id !== applicationId) {
          await deleteDoc(doc(db, 'applications', app.id));
          
          // Get waiting list for that institution/course
          const waitingQuery = query(
            collection(db, 'applications'),
            where('institutionId', '==', app.institutionId),
            where('courseId', '==', app.courseId),
            where('status', '==', 'waiting')
          );
          const waitingSnapshot = await getDocs(waitingQuery);
          
          // Promote first waiting student to admitted
          if (!waitingSnapshot.empty) {
            const firstWaiting = waitingSnapshot.docs[0];
            await updateDoc(doc(db, 'applications', firstWaiting.id), {
              status: 'admitted'
            });
          }
        }
      }

      toast.success('Institution selected successfully');
      setMultipleAdmissions([]);
      loadData();
    } catch (error) {
      toast.error('Failed to select institution');
    }
  };

  const handleApplyJob = async (jobId: string) => {
    if (!user) return;

    const result = await applyForJob({
      studentId: user.uid,
      jobId: jobId,
      companyId: jobs.find(j => j.id === jobId)?.companyId
    });

    if (result.success) {
      toast.success('Job application submitted');
    } else {
      toast.error('Failed to apply for job');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'admitted':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'waiting':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Student Dashboard</h1>
        <p className="text-gray-600">Discover courses, apply to institutions, and find career opportunities</p>
      </div>

      {/* Multiple Admissions Alert */}
      {multipleAdmissions.length > 1 && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-900">Multiple Admissions Received</CardTitle>
            <CardDescription className="text-orange-700">
              You have been admitted to multiple institutions. Please select one to proceed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {multipleAdmissions.map((app: any) => (
                <div key={app.id} className="flex justify-between items-center p-4 bg-white rounded-lg">
                  <div>
                    <div className="text-gray-900">{app.courseName}</div>
                    <div className="text-gray-600 text-sm">
                      {institutions.find(i => i.id === app.institutionId)?.name}
                    </div>
                  </div>
                  <Button onClick={() => handleSelectInstitution(app.id, app.institutionId)}>
                    Select This Institution
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="browse">Browse Courses</TabsTrigger>
          <TabsTrigger value="applications">My Applications</TabsTrigger>
          <TabsTrigger value="jobs">Job Opportunities</TabsTrigger>
          <TabsTrigger value="profile">Profile & Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          <Card>
            <CardHeader>
              <CardTitle>Discover Institutions & Courses</CardTitle>
              <CardDescription>Browse and apply to courses (maximum 2 per institution)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Select Institution</Label>
                  <Select value={selectedInstitution} onValueChange={handleInstitutionChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an institution" />
                    </SelectTrigger>
                    <SelectContent>
                      {institutions.map((inst) => (
                        <SelectItem key={inst.id} value={inst.id}>
                          {inst.name} - {inst.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedInstitution && (
                  <div className="grid md:grid-cols-2 gap-4 mt-6">
                    {courses.map((course) => {
                      const appliedCount = applications.filter(
                        (app: any) => app.institutionId === selectedInstitution
                      ).length;
                      const alreadyApplied = applications.some(
                        (app: any) => app.courseId === course.id
                      );

                      return (
                        <Card key={course.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg">{course.name}</CardTitle>
                                <CardDescription>{course.faculty}</CardDescription>
                              </div>
                              <BookOpen className="w-5 h-5 text-blue-600" />
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm">
                              <div className="text-gray-600">Duration: {course.duration}</div>
                              <div className="text-gray-600">
                                Requirements: {course.requirements || 'Contact institution'}
                              </div>
                            </div>
                            <Button
                              className="w-full mt-4"
                              onClick={() => handleApplyCourse(course)}
                              disabled={appliedCount >= 2 || alreadyApplied}
                            >
                              {alreadyApplied ? 'Already Applied' : appliedCount >= 2 ? 'Max Applications Reached' : 'Apply Now'}
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>My Applications</CardTitle>
              <CardDescription>Track your course application status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applications.map((app: any) => (
                  <div key={app.id} className="p-4 border rounded-lg flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(app.status)}
                        <span className="text-gray-900">{app.courseName}</span>
                      </div>
                      <div className="text-gray-600 text-sm">
                        {institutions.find(i => i.id === app.institutionId)?.name}
                      </div>
                      <div className="text-gray-500 text-sm mt-1">
                        Applied: {new Date(app.createdAt?.seconds * 1000).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge 
                      variant={
                        app.status === 'admitted' ? 'default' : 
                        app.status === 'rejected' ? 'destructive' : 
                        'secondary'
                      }
                    >
                      {app.status}
                    </Badge>
                  </div>
                ))}
                {applications.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No applications yet. Browse courses to get started!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle>Job Opportunities</CardTitle>
              <CardDescription>Explore career opportunities from partner companies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {jobs.map((job: any) => (
                  <Card key={job.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{job.title}</CardTitle>
                          <CardDescription>{job.companyName}</CardDescription>
                        </div>
                        <Briefcase className="w-5 h-5 text-purple-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm mb-4">
                        <div className="text-gray-600">Location: {job.location}</div>
                        <div className="text-gray-600">Type: {job.type}</div>
                        <div className="text-gray-700">{job.description}</div>
                      </div>
                      <Button 
                        className="w-full"
                        onClick={() => handleApplyJob(job.id)}
                      >
                        Apply Now
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {jobs.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    No job opportunities available at the moment
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile & Documents</CardTitle>
              <CardDescription>Upload your transcripts and certificates for job applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="transcript">Academic Transcript</Label>
                  <div className="mt-2">
                    <Input
                      id="transcript"
                      type="file"
                      onChange={(e) => setTranscript(e.target.value)}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Upload your official transcript (PDF format recommended)
                  </p>
                </div>

                <div>
                  <Label htmlFor="certificates">Additional Certificates</Label>
                  <div className="mt-2">
                    <Input
                      id="certificates"
                      type="file"
                      multiple
                      onChange={(e) => setCertificates(e.target.value)}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Upload any additional certificates or qualifications
                  </p>
                </div>

                <div>
                  <Label htmlFor="work-experience">Work Experience</Label>
                  <Textarea
                    id="work-experience"
                    placeholder="Describe your work experience..."
                    rows={4}
                  />
                </div>

                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  Save Documents
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Apply Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for Course</DialogTitle>
            <DialogDescription>
              Confirm your application for {selectedCourse?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Course Name</Label>
              <Input value={selectedCourse?.name || ''} disabled />
            </div>
            <div>
              <Label>Faculty</Label>
              <Input value={selectedCourse?.faculty || ''} disabled />
            </div>
            <div>
              <Label>Personal Statement (Optional)</Label>
              <Textarea placeholder="Why do you want to study this course?" rows={4} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmitApplication} className="flex-1">
                Submit Application
              </Button>
              <Button variant="outline" onClick={() => setShowApplyDialog(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
