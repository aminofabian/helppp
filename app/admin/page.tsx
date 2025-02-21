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

interface Stats {
  totalUsers: number;
  totalDonations: number;
  totalAmount: number;
  activeRequests: number;
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [donations, setDonations] = useState<DonationData[]>([]);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, donationsRes] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/donations')
        ]);

        const usersData = await usersRes.json();
        const donationsData = await donationsRes.json();

        setUsers(usersData);
        setDonations(donationsData);

        // Calculate stats
        setStats({
          totalUsers: usersData.length,
          totalDonations: donationsData.length,
          totalAmount: donationsData.reduce((sum: number, d: DonationData) => 
            sum + (d.status === 'COMPLETED' ? d.amount : 0), 0),
          activeRequests: donationsData.filter((d: DonationData) => 
            d.status === 'PENDING').length,
        });
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDonations = donations.filter(donation =>
    donation.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <h3 className="text-2xl font-bold">KES {stats.totalAmount.toLocaleString()}</h3>
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
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="donations">Donations</TabsTrigger>
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
                      <TableCell>KES {user.totalDonated.toLocaleString()}</TableCell>
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

          <TabsContent value="donations">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDonations.map((donation) => (
                    <TableRow key={donation.id}>
                      <TableCell className="font-medium">{donation.userId}</TableCell>
                      <TableCell>KES {donation.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge 
                          className={getStatusColor(donation.status)}
                        >
                          {donation.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(donation.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">View Details</Button>
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
