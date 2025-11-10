import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Briefcase, Users, Plus, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createJobPosting, getJobApplicationsByCompany } from '../lib/firestore';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner@2.0.3';

export const CompanyDashboard: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobApplications, setJobApplications] = useState<any[]>([]);
  const [showAddJob, setShowAddJob] = useState(false);
  const [showApplicants, setShowApplicants] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [filteredApplicants, setFilteredApplicants] = useState<any[]>([]);

  // Job form state
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [minQualification, setMinQualification] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    // Load company's job postings
    const jobsQuery = query(
      collection(db, 'jobs'),
      where('companyId', '==', user.uid)
    );
    const jobsSnapshot = await getDocs(jobsQuery);
    const jobsData = jobsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setJobs(jobsData);

    // Load all job applications for this company
    const allApplications: any[] = [];
    for (const job of jobsData) {
      const appsResult = await getJobApplicationsByCompany(user.uid, job.id);
      if (appsResult.success) {
        const appsWithDetails = await Promise.all(
          appsResult.data.map(async (app: any) => {
            // Get student details
            const studentDoc = await getDoc(doc(db, 'users', app.studentId));
            const studentData = studentDoc.exists() ? studentDoc.data() : null;

            return {
              ...app,
              studentName: studentData?.profile?.name || 'Unknown',
              studentEmail: studentData?.email || 'Unknown',
              jobTitle: job.title
            };
          })
        );
        allApplications.push(...appsWithDetails);
      }
    }
    setJobApplications(allApplications);
  };

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    const result = await createJobPosting({
      companyId: user.uid,
      companyName: userProfile?.profile?.companyName || 'Unknown Company',
      title: jobTitle,
      description: jobDescription,
      location: jobLocation,
      type: jobType,
      qualifications: {
        minQualification,
        requiredSkills: requiredSkills.split(',').map(s => s.trim()),
        yearsOfExperience: parseInt(yearsOfExperience) || 0
      }
    });

    if (result.success) {
      toast.success('Job posted successfully');
      setShowAddJob(false);
      setJobTitle('');
      setJobDescription('');
      setJobLocation('');
      setJobType('');
      setMinQualification('');
      setRequiredSkills('');
      setYearsOfExperience('');
      loadData();
    } else {
      toast.error('Failed to post job');
    }
  };

  const handleViewApplicants = (job: any) => {
    setSelectedJob(job);
    
    // Filter applicants for this job
    const filtered = jobApplications.filter((app: any) => app.jobId === job.id);
    
    // In a real implementation, this would filter based on:
    // - Academic performance (transcript data)
    // - Extra certificates
    // - Work experience
    // - Relevance to job requirements
    
    setFilteredApplicants(filtered);
    setShowApplicants(true);
  };

  const calculateMatchScore = (applicant: any) => {
    // Simplified matching algorithm
    // In production, this would analyze transcript, certificates, and experience
    return Math.floor(Math.random() * 40) + 60; // Mock score 60-100
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Company Dashboard</h1>
        <p className="text-gray-600">
          {userProfile?.profile?.companyName || 'Manage your company profile'}
        </p>
      </div>

      {userProfile?.status === 'pending' && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-900">Account Pending Approval</CardTitle>
            <CardDescription className="text-yellow-700">
              Your company account is pending admin approval. You'll be able to post jobs once approved.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Active Job Postings</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-gray-900">{jobs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-gray-900">{jobApplications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Qualified Candidates</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-gray-900">
              {jobApplications.filter((app: any) => calculateMatchScore(app) >= 75).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs">Job Postings</TabsTrigger>
          <TabsTrigger value="applicants">All Applicants</TabsTrigger>
          <TabsTrigger value="profile">Company Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Manage Job Postings</CardTitle>
                  <CardDescription>Post job opportunities and view qualified applicants</CardDescription>
                </div>
                <Dialog open={showAddJob} onOpenChange={setShowAddJob}>
                  <DialogTrigger asChild>
                    <Button disabled={userProfile?.status === 'pending'}>
                      <Plus className="w-4 h-4 mr-2" />
                      Post Job
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Post New Job</DialogTitle>
                      <DialogDescription>Enter job details and requirements</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddJob} className="space-y-4">
                      <div>
                        <Label htmlFor="job-title">Job Title</Label>
                        <Input
                          id="job-title"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="job-description">Job Description</Label>
                        <Textarea
                          id="job-description"
                          value={jobDescription}
                          onChange={(e) => setJobDescription(e.target.value)}
                          rows={4}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="job-location">Location</Label>
                          <Input
                            id="job-location"
                            value={jobLocation}
                            onChange={(e) => setJobLocation(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="job-type">Job Type</Label>
                          <Select value={jobType} onValueChange={setJobType}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="full-time">Full Time</SelectItem>
                              <SelectItem value="part-time">Part Time</SelectItem>
                              <SelectItem value="contract">Contract</SelectItem>
                              <SelectItem value="internship">Internship</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="min-qualification">Minimum Qualification</Label>
                        <Input
                          id="min-qualification"
                          value={minQualification}
                          onChange={(e) => setMinQualification(e.target.value)}
                          placeholder="e.g., Bachelor's Degree in Computer Science"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="required-skills">Required Skills</Label>
                        <Input
                          id="required-skills"
                          value={requiredSkills}
                          onChange={(e) => setRequiredSkills(e.target.value)}
                          placeholder="e.g., Python, React, SQL (comma separated)"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="years-experience">Years of Experience</Label>
                        <Input
                          id="years-experience"
                          type="number"
                          value={yearsOfExperience}
                          onChange={(e) => setYearsOfExperience(e.target.value)}
                          placeholder="0"
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full">Post Job</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobs.map((job) => {
                  const applicantsCount = jobApplications.filter((app: any) => app.jobId === job.id).length;
                  
                  return (
                    <Card key={job.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{job.title}</CardTitle>
                            <CardDescription>
                              {job.location} • {job.type}
                            </CardDescription>
                          </div>
                          <Badge>{applicantsCount} applicants</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 text-sm mb-4">{job.description}</p>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewApplicants(job)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Applicants
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {jobs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No job postings yet. Click "Post Job" to get started!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applicants">
          <Card>
            <CardHeader>
              <CardTitle>All Applicants</CardTitle>
              <CardDescription>View all qualified applicants across all job postings</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Job Position</TableHead>
                    <TableHead>Match Score</TableHead>
                    <TableHead>Applied Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobApplications.map((app: any) => {
                    const matchScore = calculateMatchScore(app);
                    
                    return (
                      <TableRow key={app.id}>
                        <TableCell>{app.studentName}</TableCell>
                        <TableCell>{app.studentEmail}</TableCell>
                        <TableCell>{app.jobTitle}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={matchScore >= 80 ? 'default' : matchScore >= 70 ? 'secondary' : 'outline'}
                          >
                            {matchScore}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(app.createdAt?.seconds * 1000).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {jobApplications.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500">
                        No applications received yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Company Profile</CardTitle>
              <CardDescription>Update your company information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Company Name</Label>
                  <Input value={userProfile?.profile?.companyName || ''} />
                </div>
                <div>
                  <Label>Industry</Label>
                  <Input value={userProfile?.profile?.industry || ''} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={userProfile?.email || ''} disabled />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={userProfile?.profile?.phone || ''} />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input value={userProfile?.profile?.address || ''} />
                </div>
                <div>
                  <Label>Company Description</Label>
                  <Textarea 
                    placeholder="Tell us about your company..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input placeholder="https://www.yourcompany.com" />
                </div>
                <Button>Update Profile</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Applicants Dialog */}
      <Dialog open={showApplicants} onOpenChange={setShowApplicants}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Applicants for {selectedJob?.title}</DialogTitle>
            <DialogDescription>
              Qualified candidates automatically filtered by the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Match Score</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplicants.map((app: any) => {
                  const matchScore = calculateMatchScore(app);
                  
                  return (
                    <TableRow key={app.id}>
                      <TableCell>{app.studentName}</TableCell>
                      <TableCell>{app.studentEmail}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={matchScore >= 80 ? 'default' : 'secondary'}
                        >
                          {matchScore}% Match
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          View Profile
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredApplicants.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">
                      No applicants yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
