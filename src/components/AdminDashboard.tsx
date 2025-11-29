import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import {
  Building2,
  GraduationCap,
  Briefcase,
  Users,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  Layers,
  BookOpen,
  Loader2,
  TrendingUp
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  createInstitution,
  getInstitutions,
  deleteInstitution,
  updateInstitution,
  createFaculty,
  getFacultiesByInstitution,
  deleteFaculty,
  createCourse,
  getCoursesByInstitution,
  deleteCourse,
  updateApplicationStatus,
  publishApplicationDecision,
  bulkPublishApplications,
  getAllApplications,
  getJobPostings,
  getAllJobApplications,
  deleteCompanyAccount
} from '../lib/firestore';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner@2.0.3';

const defaultInstitutionForm = {
  name: '',
  type: '',
  email: '',
  location: ''
};

const defaultCourseForm = {
  name: '',
  faculty: '',
  duration: '',
  requirements: ''
};

export const AdminDashboard: React.FC = () => {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportStats, setReportStats] = useState({
    totalApplications: 0,
    admitted: 0,
    published: 0,
    admissionRate: 0,
    activeJobs: 0,
    jobApplications: 0,
    placementRate: 0
  });
  const [showAddInstitution, setShowAddInstitution] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<any | null>(null);
  const [manageInstitution, setManageInstitution] = useState<any | null>(null);
  const [institutionDetails, setInstitutionDetails] = useState<{ faculties: any[]; courses: any[] }>({
    faculties: [],
    courses: []
  });
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [newInstitutionForm, setNewInstitutionForm] = useState(defaultInstitutionForm);
  const [editInstitutionForm, setEditInstitutionForm] = useState(defaultInstitutionForm);
  const [facultyName, setFacultyName] = useState('');
  const [courseForm, setCourseForm] = useState(defaultCourseForm);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [publishingIds, setPublishingIds] = useState<string[]>([]);
  const [bulkPublishing, setBulkPublishing] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (manageInstitution) {
      loadInstitutionDetails(manageInstitution.id);
    }
  }, [manageInstitution]);

  useEffect(() => {
    if (!manageInstitution) {
      setInstitutionDetails({ faculties: [], courses: [] });
      setFacultyName('');
      setCourseForm(defaultCourseForm);
    }
  }, [manageInstitution]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        instResult,
        applicationsResult,
        jobsResult,
        jobApplicationsResult,
        pendingSnapshot,
        companiesSnapshot,
        studentsSnapshot
      ] = await Promise.all([
        getInstitutions(),
        getAllApplications(),
        getJobPostings(),
        getAllJobApplications(),
        getDocs(query(collection(db, 'users'), where('status', '==', 'pending'))),
        getDocs(query(collection(db, 'users'), where('role', '==', 'company'))),
        getDocs(query(collection(db, 'users'), where('role', '==', 'student')))
      ]);

      if (instResult.success) {
        setInstitutions(instResult.data);
      }

      if (applicationsResult.success) {
        const apps = applicationsResult.data;
        setApplications(apps);
        setSelectedApplications((prev) =>
          prev.filter((id) =>
            apps.some((app: any) => app.id === id && !app.isPublished && app.status !== 'pending')
          )
        );
        const totalApplications = apps.length;
        const admitted = apps.filter((app: any) => app.status === 'admitted').length;
        const published = apps.filter((app: any) => app.isPublished).length;
        const admissionRate = totalApplications ? Math.round((admitted / totalApplications) * 100) : 0;
        const activeJobs = jobsResult.success ? jobsResult.data.length : 0;
        const jobApplicationsCount = jobApplicationsResult.success ? jobApplicationsResult.data.length : 0;
        const placementRate = published
          ? Math.min(100, Math.round((jobApplicationsCount / published) * 100))
          : 0;

        setReportStats({
          totalApplications,
          admitted,
          published,
          admissionRate,
          activeJobs,
          jobApplications: jobApplicationsCount,
          placementRate
        });
      }

      const pending = pendingSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPendingApprovals(pending);

      const companiesData = companiesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCompanies(companiesData);

      const studentsData = studentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setStudents(studentsData);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadInstitutionDetails = async (institutionId: string) => {
    setDetailsLoading(true);
    try {
      const [facultiesResult, coursesResult] = await Promise.all([
        getFacultiesByInstitution(institutionId),
        getCoursesByInstitution(institutionId)
      ]);

      setInstitutionDetails({
        faculties: facultiesResult.success ? facultiesResult.data : [],
        courses: coursesResult.success ? coursesResult.data : []
      });
    } catch (error) {
      toast.error('Failed to load institution details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleAddInstitution = async (e: React.FormEvent) => {
    e.preventDefault();

    const { name, type, email, location } = newInstitutionForm;

    const result = await createInstitution({
      name,
      type,
      email,
      location,
      status: 'active'
    });

    if (result.success) {
      toast.success('Institution added successfully');
      setShowAddInstitution(false);
      setNewInstitutionForm(defaultInstitutionForm);
      loadData();
    } else {
      toast.error('Failed to add institution');
    }
  };

  const handleEditInstitution = (institution: any) => {
    setEditingInstitution(institution);
    setEditInstitutionForm({
      name: institution.name || '',
      type: institution.type || '',
      email: institution.email || '',
      location: institution.location || ''
    });
  };

  const handleUpdateInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInstitution) return;

    const result = await updateInstitution(editingInstitution.id, editInstitutionForm);

    if (result.success) {
      toast.success('Institution updated successfully');
      setEditingInstitution(null);
      setEditInstitutionForm(defaultInstitutionForm);
      loadData();
    } else {
      toast.error(result.error || 'Failed to update institution');
    }
  };

  const handleDeleteInstitution = async (id: string) => {
    if (confirm('Are you sure you want to delete this institution?')) {
      const result = await deleteInstitution(id);
      if (result.success) {
        toast.success('Institution deleted');
        loadData();
      } else {
        toast.error('Failed to delete institution');
      }
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { status: 'active' });
      toast.success('User approved');
      loadData();
    } catch (error) {
      toast.error('Failed to approve user');
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { status: 'rejected' });
      toast.success('User rejected');
      loadData();
    } catch (error) {
      toast.error('Failed to reject user');
    }
  };

  const handleSuspendCompany = async (companyId: string) => {
    try {
      await updateDoc(doc(db, 'users', companyId), { status: 'suspended' });
      toast.success('Company suspended');
      loadData();
    } catch (error) {
      toast.error('Failed to suspend company');
    }
  };

  const handleActivateCompany = async (companyId: string) => {
    try {
      await updateDoc(doc(db, 'users', companyId), { status: 'active' });
      toast.success('Company activated');
      loadData();
    } catch (error) {
      toast.error('Failed to activate company');
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (!confirm('Delete this company account and all related data?')) return;

    const result = await deleteCompanyAccount(companyId);
    if (result.success) {
      toast.success('Company account deleted');
      loadData();
    } else {
      toast.error(result.error || 'Failed to delete company account');
    }
  };

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageInstitution || !facultyName.trim()) return;

    const result = await createFaculty({
      institutionId: manageInstitution.id,
      name: facultyName.trim()
    });

    if (result.success) {
      toast.success('Faculty added');
      setFacultyName('');
      loadInstitutionDetails(manageInstitution.id);
    } else {
      toast.error(result.error || 'Failed to add faculty');
    }
  };

  const handleDeleteFaculty = async (id: string) => {
    if (!manageInstitution) return;
    const result = await deleteFaculty(id);
    if (result.success) {
      toast.success('Faculty deleted');
      loadInstitutionDetails(manageInstitution.id);
    } else {
      toast.error(result.error || 'Failed to delete faculty');
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageInstitution || !courseForm.name || !courseForm.faculty) return;

    const result = await createCourse({
      institutionId: manageInstitution.id,
      name: courseForm.name,
      faculty: courseForm.faculty,
      duration: courseForm.duration,
      requirements: courseForm.requirements,
      status: 'active'
    });

    if (result.success) {
      toast.success('Course added');
      setCourseForm(defaultCourseForm);
      loadInstitutionDetails(manageInstitution.id);
    } else {
      toast.error(result.error || 'Failed to add course');
    }
  };

  const handleDeleteCourse = async (id: string) => {
    const result = await deleteCourse(id);
    if (result.success) {
      toast.success('Course deleted');
      if (manageInstitution) {
        loadInstitutionDetails(manageInstitution.id);
      }
    } else {
      toast.error(result.error || 'Failed to delete course');
    }
  };

  const handleToggleSelectApplication = (application: any) => {
    if (application.status === 'pending' || application.isPublished) return;
    setSelectedApplications((prev) =>
      prev.includes(application.id)
        ? prev.filter((id) => id !== application.id)
        : [...prev, application.id]
    );
  };

  const publishableApplications = applications.filter(
    (app: any) => app.status !== 'pending' && !app.isPublished
  );
  const allPublishableSelected =
    publishableApplications.length > 0 &&
    publishableApplications.every((app: any) => selectedApplications.includes(app.id));

  const handleToggleSelectAll = () => {
    if (allPublishableSelected) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(publishableApplications.map((app: any) => app.id));
    }
  };

  const handlePublishApplication = async (id: string) => {
    setPublishingIds((prev) => [...prev, id]);
    const result = await publishApplicationDecision(id);
    if (result.success) {
      toast.success('Admission published');
      loadData();
    } else {
      toast.error(result.error || 'Failed to publish admission');
    }
    setPublishingIds((prev) => prev.filter((item) => item !== id));
  };

  const handleBulkPublish = async () => {
    if (!selectedApplications.length) return;
    setBulkPublishing(true);
    const result = await bulkPublishApplications(selectedApplications);
    if (result.success) {
      toast.success('Selected admissions published');
      setSelectedApplications([]);
      loadData();
    } else {
      toast.error(result.error || 'Failed to publish admissions');
    }
    setBulkPublishing(false);
  };

  const handleChangeApplicationStatus = async (application: any, status: string) => {
    setStatusUpdatingId(application.id);
    const result = await updateApplicationStatus(
      application.id,
      status,
      application.institutionId,
      application.studentId
    );
    if (result.success) {
      toast.success(`Application marked as ${status}`);
      loadData();
    } else {
      toast.error(result.error || 'Failed to update application');
    }
    setStatusUpdatingId(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage institutions, users, and system operations</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Institutions</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-gray-900">{institutions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Students</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-gray-900">{students.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Companies</CardTitle>
            <Briefcase className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-gray-900">{companies.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Pending Approvals</CardTitle>
            <GraduationCap className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-gray-900">{pendingApprovals.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Applications</CardTitle>
            <GraduationCap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-gray-900">{reportStats.totalApplications}</div>
            <p className="text-xs text-gray-500 mt-1">
              {reportStats.published} published decisions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Admission Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-gray-900">{reportStats.admissionRate}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {reportStats.admitted} total admissions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Active Job Postings</CardTitle>
            <Briefcase className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-gray-900">{reportStats.activeJobs}</div>
            <p className="text-xs text-gray-500 mt-1">
              {reportStats.jobApplications} applications submitted
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Placement Indicator</CardTitle>
            <Users className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-gray-900">{reportStats.placementRate}%</div>
            <p className="text-xs text-gray-500 mt-1">
              Based on job applications vs published admissions
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="institutions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="institutions">Institutions</TabsTrigger>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="admissions">Admissions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="institutions">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Manage Institutions</CardTitle>
                  <CardDescription>Add, edit, or remove higher learning institutions</CardDescription>
                </div>
                <Dialog open={showAddInstitution} onOpenChange={setShowAddInstitution}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Institution
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Institution</DialogTitle>
                      <DialogDescription>Enter the institution details</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddInstitution} className="space-y-4">
                      <div>
                        <Label htmlFor="inst-name">Institution Name</Label>
                        <Input
                          id="inst-name"
                          value={newInstitutionForm.name}
                          onChange={(e) =>
                            setNewInstitutionForm((prev) => ({ ...prev, name: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="inst-type">Type</Label>
                        <Select
                          value={newInstitutionForm.type}
                          onValueChange={(value) =>
                            setNewInstitutionForm((prev) => ({ ...prev, type: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="university">University</SelectItem>
                            <SelectItem value="college">College</SelectItem>
                            <SelectItem value="technical">Technical Institute</SelectItem>
                            <SelectItem value="vocational">Vocational School</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="inst-email">Email</Label>
                        <Input
                          id="inst-email"
                          type="email"
                          value={newInstitutionForm.email}
                          onChange={(e) =>
                            setNewInstitutionForm((prev) => ({ ...prev, email: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="inst-location">Location</Label>
                        <Input
                          id="inst-location"
                          value={newInstitutionForm.location}
                          onChange={(e) =>
                            setNewInstitutionForm((prev) => ({ ...prev, location: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Add Institution
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {institutions.map((inst) => (
                    <TableRow key={inst.id}>
                      <TableCell>{inst.name}</TableCell>
                      <TableCell className="capitalize">{inst.type}</TableCell>
                      <TableCell>{inst.location}</TableCell>
                      <TableCell>{inst.email}</TableCell>
                      <TableCell>
                        <Badge variant="default">{inst.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditInstitution(inst)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setManageInstitution(inst)}
                          >
                            <Layers className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteInstitution(inst.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Review and approve institution and company registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingApprovals.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        {user.profile?.institutionName || user.profile?.companyName || user.profile?.name}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="capitalize">
                        <Badge>{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApproveUser(user.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectUser(user.id)}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admissions">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Admissions & Publication</CardTitle>
                  <CardDescription>Review decisions, publish admissions, and manage statuses</CardDescription>
                </div>
                <Button
                  variant="default"
                  onClick={handleBulkPublish}
                  disabled={!selectedApplications.length || bulkPublishing}
                >
                  {bulkPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Publish Selected ({selectedApplications.length})
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allPublishableSelected && publishableApplications.length > 0}
                        onCheckedChange={handleToggleSelectAll}
                        disabled={!publishableApplications.length}
                      />
                    </TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Institution</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Publication</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application: any) => {
                    const appliedDate = application.createdAt?.seconds
                      ? new Date(application.createdAt.seconds * 1000).toLocaleDateString()
                      : 'N/A';
                    const isPublishing = publishingIds.includes(application.id);
                    const isStatusUpdating = statusUpdatingId === application.id;
                    const isSelectable =
                      application.status !== 'pending' && !application.isPublished;

                    return (
                      <TableRow key={application.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedApplications.includes(application.id)}
                            disabled={!isSelectable}
                            onCheckedChange={() => handleToggleSelectApplication(application)}
                          />
                        </TableCell>
                        <TableCell>{application.studentName || 'Student'}</TableCell>
                        <TableCell>{application.institutionName || application.institutionId}</TableCell>
                        <TableCell>{application.courseName}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              application.status === 'admitted'
                                ? 'default'
                                : application.status === 'rejected'
                                  ? 'destructive'
                                  : application.status === 'waiting'
                                    ? 'secondary'
                                    : 'outline'
                            }
                          >
                            {application.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={application.isPublished ? 'default' : 'secondary'}>
                            {application.isPublished ? 'Published' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>{appliedDate}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleChangeApplicationStatus(application, 'admitted')}
                              disabled={isStatusUpdating}
                            >
                              {isStatusUpdating && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Admit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleChangeApplicationStatus(application, 'waiting')}
                              disabled={isStatusUpdating}
                            >
                              Waiting
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleChangeApplicationStatus(application, 'rejected')}
                              disabled={isStatusUpdating}
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handlePublishApplication(application.id)}
                              disabled={application.isPublished || application.status === 'pending' || isPublishing}
                            >
                              {isPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Publish
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="companies">
          <Card>
            <CardHeader>
              <CardTitle>Manage Companies</CardTitle>
              <CardDescription>View and manage registered companies</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company: any) => (
                    <TableRow key={company.id}>
                      <TableCell>{company.profile?.companyName}</TableCell>
                      <TableCell>{company.email}</TableCell>
                      <TableCell>{company.profile?.industry}</TableCell>
                      <TableCell>
                        <Badge variant={company.status === 'active' ? 'default' : 'secondary'}>
                          {company.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSuspendCompany(company.id)}
                            disabled={company.status === 'suspended'}
                          >
                            Suspend
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleActivateCompany(company.id)}
                            disabled={company.status === 'active'}
                          >
                            Activate
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteCompany(company.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Registered Students</CardTitle>
              <CardDescription>View all registered students in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student: any) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.profile?.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.profile?.phone}</TableCell>
                      <TableCell>
                        <Badge>{student.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <div className="space-y-6">
            {/* Application Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Application Status Distribution</CardTitle>
                <CardDescription>Breakdown of all applications by current status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: 'Pending',
                          value: applications.filter((app: any) => app.status === 'pending').length,
                          color: '#F59E0B'
                        },
                        {
                          name: 'Admitted',
                          value: applications.filter((app: any) => app.status === 'admitted').length,
                          color: '#10B981'
                        },
                        {
                          name: 'Rejected',
                          value: applications.filter((app: any) => app.status === 'rejected').length,
                          color: '#EF4444'
                        },
                        {
                          name: 'Waiting List',
                          value: applications.filter((app: any) => app.status === 'waiting').length,
                          color: '#8B5CF6'
                        }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Pending', value: applications.filter((app: any) => app.status === 'pending').length, color: '#F59E0B' },
                        { name: 'Admitted', value: applications.filter((app: any) => app.status === 'admitted').length, color: '#10B981' },
                        { name: 'Rejected', value: applications.filter((app: any) => app.status === 'rejected').length, color: '#EF4444' },
                        { name: 'Waiting List', value: applications.filter((app: any) => app.status === 'waiting').length, color: '#8B5CF6' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Institution Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Institution Performance</CardTitle>
                <CardDescription>Applications received per institution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={institutions.map((inst: any) => ({
                      name: inst.name,
                      applications: applications.filter((app: any) => app.institutionId === inst.id).length,
                      admitted: applications.filter((app: any) => app.institutionId === inst.id && app.status === 'admitted').length
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="applications" fill="#3B82F6" name="Total Applications" />
                    <Bar dataKey="admitted" fill="#10B981" name="Admitted" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* User Growth Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Growth</CardTitle>
                <CardDescription>User registrations across different roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-600">Total Students</div>
                        <div className="text-2xl font-bold text-blue-600">{students.length}</div>
                      </div>
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg bg-green-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-600">Total Institutions</div>
                        <div className="text-2xl font-bold text-green-600">{institutions.length}</div>
                      </div>
                      <Building2 className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg bg-purple-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-600">Total Companies</div>
                        <div className="text-2xl font-bold text-purple-600">{companies.length}</div>
                      </div>
                      <Briefcase className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart
                    data={[
                      { name: 'Current', students: students.length, institutions: institutions.length, companies: companies.length }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="students" stackId="1" stroke="#3B82F6" fill="#3B82F6" name="Students" />
                    <Area type="monotone" dataKey="institutions" stackId="1" stroke="#10B981" fill="#10B981" name="Institutions" />
                    <Area type="monotone" dataKey="companies" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" name="Companies" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Job Market Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Job Market Activity</CardTitle>
                <CardDescription>Active job postings and application trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-600">Active Job Postings</div>
                    <div className="text-2xl font-bold text-gray-900 mt-2">{reportStats.activeJobs}</div>
                    <p className="text-xs text-gray-500 mt-1 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Available opportunities
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-600">Job Applications</div>
                    <div className="text-2xl font-bold text-gray-900 mt-2">{reportStats.jobApplications}</div>
                    <p className="text-xs text-gray-500 mt-1">
                      Total applications submitted
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-600">Placement Rate</div>
                    <div className="text-2xl font-bold text-gray-900 mt-2">{reportStats.placementRate}%</div>
                    <p className="text-xs text-gray-500 mt-1">
                      Job applications vs published admissions
                    </p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart
                    data={[
                      { name: 'Overview', jobs: reportStats.activeJobs, applications: reportStats.jobApplications }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="jobs" stroke="#8B5CF6" strokeWidth={2} name="Active Jobs" />
                    <Line type="monotone" dataKey="applications" stroke="#3B82F6" strokeWidth={2} name="Applications" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Key Metrics Summary */}
            <Card>
              <CardHeader>
                <CardTitle>System Metrics Summary</CardTitle>
                <CardDescription>Comprehensive overview of platform performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-gray-600 text-sm">Total Applications</div>
                    <div className="text-gray-900 mt-2 text-xl font-semibold">
                      {reportStats.totalApplications}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {reportStats.published} published • {reportStats.admitted} admitted
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-gray-600 text-sm">Admission Rate</div>
                    <div className="text-gray-900 mt-2 text-xl font-semibold">
                      {reportStats.admissionRate}%
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Ratio of admitted students to total applicants
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-gray-600 text-sm">Active Institutions</div>
                    <div className="text-gray-900 mt-2 text-xl font-semibold">
                      {institutions.filter((inst: any) => inst.status === 'active').length}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Out of {institutions.length} total institutions
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-gray-600 text-sm">Active Companies</div>
                    <div className="text-gray-900 mt-2 text-xl font-semibold">
                      {companies.filter((comp: any) => comp.status === 'active').length}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Out of {companies.length} total companies
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!editingInstitution} onOpenChange={(open) => !open && setEditingInstitution(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Institution</DialogTitle>
            <DialogDescription>Update institution details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateInstitution} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Institution Name</Label>
              <Input
                id="edit-name"
                value={editInstitutionForm.name}
                onChange={(e) =>
                  setEditInstitutionForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-type">Type</Label>
              <Select
                value={editInstitutionForm.type}
                onValueChange={(value) =>
                  setEditInstitutionForm((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="university">University</SelectItem>
                  <SelectItem value="college">College</SelectItem>
                  <SelectItem value="technical">Technical Institute</SelectItem>
                  <SelectItem value="vocational">Vocational School</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editInstitutionForm.email}
                onChange={(e) =>
                  setEditInstitutionForm((prev) => ({ ...prev, email: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={editInstitutionForm.location}
                onChange={(e) =>
                  setEditInstitutionForm((prev) => ({ ...prev, location: e.target.value }))
                }
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!manageInstitution} onOpenChange={(open) => !open && setManageInstitution(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Manage Faculties & Courses — {manageInstitution?.name}
            </DialogTitle>
            <DialogDescription>
              Add or update faculties and courses under this institution
            </DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-600" />
                  Faculties
                </h3>
                <form onSubmit={handleAddFaculty} className="flex flex-col sm:flex-row gap-3 mb-4">
                  <Input
                    placeholder="Faculty name (e.g., Faculty of Science)"
                    value={facultyName}
                    onChange={(e) => setFacultyName(e.target.value)}
                    required
                  />
                  <Button type="submit" className="whitespace-nowrap">
                    Add Faculty
                  </Button>
                </form>
                <div className="grid gap-2 md:grid-cols-2">
                  {institutionDetails.faculties.map((faculty: any) => (
                    <Card key={faculty.id}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                          <CardTitle className="text-base font-semibold">{faculty.name}</CardTitle>
                          <CardDescription>
                            Added{' '}
                            {faculty.createdAt?.seconds
                              ? new Date(faculty.createdAt.seconds * 1000).toLocaleDateString()
                              : ''}
                          </CardDescription>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteFaculty(faculty.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </CardHeader>
                    </Card>
                  ))}
                  {!institutionDetails.faculties.length && (
                    <div className="text-sm text-gray-500 border rounded-lg p-4">
                      No faculties added yet.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-purple-600" />
                  Courses
                </h3>
                <form onSubmit={handleAddCourse} className="grid gap-3 md:grid-cols-2 mb-4">
                  <Input
                    placeholder="Course name"
                    value={courseForm.name}
                    onChange={(e) => setCourseForm((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                  <Select
                    value={courseForm.faculty}
                    onValueChange={(value) => setCourseForm((prev) => ({ ...prev, faculty: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select faculty" />
                    </SelectTrigger>
                    <SelectContent>
                      {institutionDetails.faculties.map((faculty: any) => (
                        <SelectItem key={faculty.id} value={faculty.name}>
                          {faculty.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Duration (e.g., 4 years)"
                    value={courseForm.duration}
                    onChange={(e) =>
                      setCourseForm((prev) => ({ ...prev, duration: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="Entry requirements"
                    value={courseForm.requirements}
                    onChange={(e) =>
                      setCourseForm((prev) => ({ ...prev, requirements: e.target.value }))
                    }
                  />
                  <div className="md:col-span-2">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={!institutionDetails.faculties.length}
                    >
                      Add Course
                    </Button>
                  </div>
                </form>

                <div className="space-y-3">
                  {institutionDetails.courses.map((course: any) => (
                    <Card key={course.id}>
                      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                        <div>
                          <CardTitle className="text-base font-semibold">
                            {course.name}{' '}
                            <span className="text-sm font-normal text-gray-500">
                              • {course.faculty}
                            </span>
                          </CardTitle>
                          <CardDescription>
                            Duration: {course.duration || 'N/A'} | Requirements:{' '}
                            {course.requirements || 'Refer to institution'}
                          </CardDescription>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </CardHeader>
                    </Card>
                  ))}
                  {!institutionDetails.courses.length && (
                    <div className="text-sm text-gray-500 border rounded-lg p-4">
                      No courses added yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
