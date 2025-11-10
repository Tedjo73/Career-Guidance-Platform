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
import { Building2, GraduationCap, Briefcase, Users, Plus, Trash2, Edit, CheckCircle, XCircle } from 'lucide-react';
import { createInstitution, getInstitutions, deleteInstitution } from '../lib/firestore';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner@2.0.3';

export const AdminDashboard: React.FC = () => {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddInstitution, setShowAddInstitution] = useState(false);

  // Institution form state
  const [institutionName, setInstitutionName] = useState('');
  const [institutionType, setInstitutionType] = useState('');
  const [institutionEmail, setInstitutionEmail] = useState('');
  const [institutionLocation, setInstitutionLocation] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // Load institutions
    const instResult = await getInstitutions();
    if (instResult.success) {
      setInstitutions(instResult.data);
    }

    // Load pending approvals (companies and institutions)
    const usersQuery = query(collection(db, 'users'), where('status', '==', 'pending'));
    const usersSnapshot = await getDocs(usersQuery);
    const pending = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setPendingApprovals(pending);

    // Load all companies
    const companiesQuery = query(collection(db, 'users'), where('role', '==', 'company'));
    const companiesSnapshot = await getDocs(companiesQuery);
    const companiesData = companiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCompanies(companiesData);

    // Load all students
    const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
    const studentsSnapshot = await getDocs(studentsQuery);
    const studentsData = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setStudents(studentsData);

    setLoading(false);
  };

  const handleAddInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await createInstitution({
      name: institutionName,
      type: institutionType,
      email: institutionEmail,
      location: institutionLocation,
      status: 'active'
    });

    if (result.success) {
      toast.success('Institution added successfully');
      setShowAddInstitution(false);
      setInstitutionName('');
      setInstitutionType('');
      setInstitutionEmail('');
      setInstitutionLocation('');
      loadData();
    } else {
      toast.error('Failed to add institution');
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

      <Tabs defaultValue="institutions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="institutions">Institutions</TabsTrigger>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
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
                          value={institutionName}
                          onChange={(e) => setInstitutionName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="inst-type">Type</Label>
                        <Select value={institutionType} onValueChange={setInstitutionType}>
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
                          value={institutionEmail}
                          onChange={(e) => setInstitutionEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="inst-location">Location</Label>
                        <Input
                          id="inst-location"
                          value={institutionLocation}
                          onChange={(e) => setInstitutionLocation(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full">Add Institution</Button>
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
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
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
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleSuspendCompany(company.id)}
                          disabled={company.status === 'suspended'}
                        >
                          Suspend
                        </Button>
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
          <Card>
            <CardHeader>
              <CardTitle>System Reports</CardTitle>
              <CardDescription>View comprehensive system statistics and analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-gray-600 text-sm">Total Applications</div>
                    <div className="text-gray-900 mt-1">Track student course applications</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-gray-600 text-sm">Active Job Postings</div>
                    <div className="text-gray-900 mt-1">Monitor company job listings</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-gray-600 text-sm">Admission Rate</div>
                    <div className="text-gray-900 mt-1">View student admission statistics</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-gray-600 text-sm">Placement Rate</div>
                    <div className="text-gray-900 mt-1">Track graduate employment</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
