'use client';

import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Users,
  HandHeart,
  AlertCircle,
  DollarSign,
  Activity,
  Search,
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface UserData {
  id: string;
  email: string;
  level: number;
  totalDonated: number;
  donationCount: number;
  createdAt?: string;
}

interface DonationData {
  id: string;
  userId: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface RequestData {
  id: string;
  title: string;
  amount: number;
  createdAt: string;
  deadline: string;
  totalDonated: number;
  isFullyFunded: boolean;
  daysRunning: number;
  daysUntilDeadline: number;
  isExpired: boolean;
  user: {
    email: string;
  };
}

interface Stats {
  totalUsers: number;
  totalDonations: number;
  totalAmount: number;
  activeRequests: number;
}

// Add currency formatter
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount);
};

export default function AdminPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [donations, setDonations] = useState<DonationData[]>([]);
  const [donationsPagination, setDonationsPagination] = useState({
    total: 0,
    pages: 0,
    currentPage: 1,
    perPage: 20,
  });
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalDonations: 0,
    totalAmount: 0,
    activeRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newLevel, setNewLevel] = useState<number>(0);
  const [extendingRequest, setExtendingRequest] = useState<string | null>(null);
  const [extensionDays, setExtensionDays] = useState<number>(7);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleUpdateLevel = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, level: newLevel }),
      });

      if (!response.ok) throw new Error('Failed to update user level');

      const updatedUser = await response.json();
      setUsers(users.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      ));
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user level:', error);
    }
  };

  const handleExtendExpiry = async (requestId: string) => {
    try {
      const response = await fetch('/api/admin/requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, extensionDays }),
      });

      if (!response.ok) throw new Error('Failed to extend request expiry');

      const updatedRequest = await response.json();
      setRequests(requests.map(request => 
        request.id === updatedRequest.id ? updatedRequest : request
      ));
      setExtendingRequest(null);
    } catch (error) {
      console.error('Error extending request expiry:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, donationsRes, requestsRes] = await Promise.all([
          fetch('/api/admin/users'),
          fetch(`/api/admin/donations?page=${currentPage}&limit=20${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}`),
          fetch('/api/admin/requests')
        ]);

        const usersData = await usersRes.json();
        const { donations: donationsData, pagination } = await donationsRes.json();
        const requestsData = await requestsRes.json();

        setUsers(usersData);
        setDonations(donationsData);
        setDonationsPagination(pagination);
        setRequests(requestsData);

        // Calculate stats
        setStats({
          totalUsers: usersData.length,
          totalDonations: pagination.total,
          totalAmount: donationsData.reduce((sum: number, d: DonationData) => 
            sum + (d.status === 'COMPLETED' ? d.amount : 0), 0),
          activeRequests: requestsData.filter((r: RequestData) => !r.isFullyFunded).length,
        });
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, searchTerm]);

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRequests = requests.filter(request =>
    request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Input
              type="search"
              placeholder="Search users or donations..."
              className="w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <h3 className="text-2xl font-bold">{stats.totalUsers}</h3>
            </div>
          </Card>

          <Card className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Donations</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</p>
            </div>
          </Card>

          <Card className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <HandHeart className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Donation Count</p>
              <h3 className="text-2xl font-bold">{stats.totalDonations}</h3>
            </div>
          </Card>

          <Card className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Requests</p>
              <h3 className="text-2xl font-bold">{stats.activeRequests}</h3>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="donations">
              <HandHeart className="w-4 h-4 mr-2" />
              Donations
            </TabsTrigger>
            <TabsTrigger value="requests">
              <AlertCircle className="w-4 h-4 mr-2" />
              Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Total Donated</TableHead>
                    <TableHead>Donation Count</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        {editingUser === user.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              value={newLevel}
                              onChange={(e) => setNewLevel(parseInt(e.target.value))}
                              className="w-20"
                            />
                            <Button 
                              size="sm"
                              onClick={() => handleUpdateLevel(user.id)}
                            >
                              Save
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingUser(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>Level {user.level}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingUser(user.id);
                                setNewLevel(user.level);
                              }}
                            >
                              Edit
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(user.totalDonated)}</TableCell>
                      <TableCell>{user.donationCount}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">View Details</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="donations" className="space-y-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donations.length > 0 ? (
                    donations.map((donation) => (
                      <TableRow key={donation.id}>
                        <TableCell>{donation.userId}</TableCell>
                        <TableCell>{formatCurrency(donation.amount)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(donation.status)}`}>
                            {donation.status}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(donation.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        {searchTerm ? 'No donations found matching your search.' : 'No donations available.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {donations.length > 0 && (
                <div className="flex items-center justify-between py-4 px-4">
                  <div className="text-sm text-gray-600">
                    Showing {donations.length} of {donationsPagination.total} donations
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {donationsPagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === donationsPagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Donated</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.title}</TableCell>
                      <TableCell>{request.user.email}</TableCell>
                      <TableCell>{formatCurrency(request.amount)}</TableCell>
                      <TableCell>{formatCurrency(request.totalDonated)}</TableCell>
                      <TableCell>
                        <Badge variant={request.isFullyFunded ? "default" : request.isExpired ? "destructive" : "secondary"}>
                          {request.isFullyFunded ? 'Fully Funded' : request.isExpired ? 'Expired' : 'In Progress'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request.daysRunning} days
                      </TableCell>
                      <TableCell>
                        {request.daysUntilDeadline !== null ? (
                          request.isExpired ? (
                            <span className="text-red-500">Expired</span>
                          ) : (
                            <span>{request.daysUntilDeadline} days left</span>
                          )
                        ) : (
                          'No deadline'
                        )}
                      </TableCell>
                      <TableCell>
                        {extendingRequest === request.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="1"
                              value={extensionDays}
                              onChange={(e) => setExtensionDays(parseInt(e.target.value))}
                              className="w-20"
                            />
                            <Button 
                              size="sm"
                              onClick={() => handleExtendExpiry(request.id)}
                            >
                              Extend
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setExtendingRequest(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setExtendingRequest(request.id);
                              setExtensionDays(7);
                            }}
                          >
                            Extend Time
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
