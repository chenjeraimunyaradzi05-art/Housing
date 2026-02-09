'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Card,
  Button,
  Input,
  Select,
  Textarea,
  Badge,
  Modal,
  Spinner,
} from '@/components/ui';
import Layout from '@/components/ui/Layout';

// ==================== TYPES ====================

interface MaintenanceRecord {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: string;
  status: string;
  estimatedCost?: number;
  actualCost?: number;
  vendorName?: string;
  vendorPhone?: string;
  vendorEmail?: string;
  scheduledDate?: string;
  completedDate?: string;
  notes?: string;
  recurring: boolean;
  recurringInterval?: string;
  createdAt: string;
  property: {
    id: string;
    title: string;
    address: string;
  };
}

interface MaintenanceStats {
  overview: {
    totalRecords: number;
    totalEstimatedCost: number;
    totalActualCost: number;
  };
  byStatus: Array<{ status: string; count: number }>;
  byCategory: Array<{ category: string; count: number; totalCost: number }>;
  byPriority: Array<{ priority: string; count: number }>;
  upcoming: MaintenanceRecord[];
  overdue: MaintenanceRecord[];
}

const CATEGORIES = [
  'PLUMBING',
  'ELECTRICAL',
  'HVAC',
  'APPLIANCE',
  'STRUCTURAL',
  'LANDSCAPING',
  'CLEANING',
  'PEST_CONTROL',
  'ROOFING',
  'FLOORING',
  'PAINTING',
  'SECURITY',
  'OTHER',
];

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const STATUSES = ['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  MEDIUM: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  HIGH: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  URGENT: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-800',
  SCHEDULED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

// ==================== MAIN COMPONENT ====================

export default function MaintenancePage() {
  const params = useParams();
  const propertyId = params?.id as string;

  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [stats, setStats] = useState<MaintenanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [filter, setFilter] = useState({
    status: '',
    priority: '',
    category: '',
  });

  // ==================== FETCH DATA ====================

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (propertyId) params.append('propertyId', propertyId);
      if (filter.status) params.append('status', filter.status);
      if (filter.priority) params.append('priority', filter.priority);
      if (filter.category) params.append('category', filter.category);

      const response = await fetch(`/api/maintenance?${params}`);
      const data = await response.json();
      if (data.success) {
        setRecords(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch maintenance records:', error);
    } finally {
      setLoading(false);
    }
  }, [propertyId, filter]);

  const fetchStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (propertyId) params.append('propertyId', propertyId);

      const response = await fetch(`/api/maintenance/stats/summary?${params}`);
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchRecords();
    fetchStats();
  }, [fetchRecords, fetchStats]);

  // ==================== HANDLERS ====================

  const handleCreate = () => {
    setEditingRecord(null);
    setShowModal(true);
  };

  const handleEdit = (record: MaintenanceRecord) => {
    setEditingRecord(record);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this maintenance record?')) return;

    try {
      await fetch(`/api/maintenance/${id}`, { method: 'DELETE' });
      fetchRecords();
      fetchStats();
    } catch (error) {
      console.error('Failed to delete record:', error);
    }
  };

  const handleSave = async (data: any) => {
    try {
      const url = editingRecord
        ? `/api/maintenance/${editingRecord.id}`
        : '/api/maintenance';
      const method = editingRecord ? 'PATCH' : 'POST';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, propertyId }),
      });

      setShowModal(false);
      fetchRecords();
      fetchStats();
    } catch (error) {
      console.error('Failed to save record:', error);
    }
  };

  // ==================== RENDER ====================

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Maintenance Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track repairs, maintenance schedules, and vendor contacts
            </p>
          </div>
          <Button onClick={handleCreate}>+ New Record</Button>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-sm text-gray-500">Total Records</p>
              <p className="text-2xl font-bold">{stats.overview.totalRecords}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-500">Estimated Costs</p>
              <p className="text-2xl font-bold text-amber-600">
                ${stats.overview.totalEstimatedCost.toLocaleString()}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-500">Actual Costs</p>
              <p className="text-2xl font-bold text-red-600">
                ${stats.overview.totalActualCost.toLocaleString()}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.overdue.length}
              </p>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4">
            <Select
              label="Status"
              value={filter.status}
              onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
              options={[
                { value: '', label: 'All Statuses' },
                ...STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') })),
              ]}
            />
            <Select
              label="Priority"
              value={filter.priority}
              onChange={(e) => setFilter((f) => ({ ...f, priority: e.target.value }))}
              options={[
                { value: '', label: 'All Priorities' },
                ...PRIORITIES.map((p) => ({ value: p, label: p })),
              ]}
            />
            <Select
              label="Category"
              value={filter.category}
              onChange={(e) => setFilter((f) => ({ ...f, category: e.target.value }))}
              options={[
                { value: '', label: 'All Categories' },
                ...CATEGORIES.map((c) => ({ value: c, label: c.replace('_', ' ') })),
              ]}
            />
          </div>
        </Card>

        {/* Records List */}
        {loading ? (
          <div className="flex justify-center p-12">
            <Spinner size="lg" />
          </div>
        ) : records.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">No maintenance records found</p>
            <Button onClick={handleCreate} className="mt-4">
              Create First Record
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <Card key={record.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{record.title}</h3>
                      <Badge className={priorityColors[record.priority]}>
                        {record.priority}
                      </Badge>
                      <Badge className={statusColors[record.status]}>
                        {record.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {record.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>📁 {record.category.replace('_', ' ')}</span>
                      {record.scheduledDate && (
                        <span>
                          📅 {new Date(record.scheduledDate).toLocaleDateString()}
                        </span>
                      )}
                      {record.vendorName && <span>👷 {record.vendorName}</span>}
                      {record.estimatedCost && (
                        <span>💰 Est: ${record.estimatedCost.toLocaleString()}</span>
                      )}
                      {record.actualCost && (
                        <span>💵 Actual: ${record.actualCost.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(record)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(record.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        <MaintenanceModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          record={editingRecord}
        />
      </div>
    </Layout>
  );
}

// ==================== MODAL COMPONENT ====================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  record: MaintenanceRecord | null;
}

function MaintenanceModal({ isOpen, onClose, onSave, record }: ModalProps) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'OTHER',
    priority: 'MEDIUM',
    status: 'PENDING',
    estimatedCost: '',
    actualCost: '',
    vendorName: '',
    vendorPhone: '',
    vendorEmail: '',
    scheduledDate: '',
    notes: '',
    recurring: false,
  });

  useEffect(() => {
    if (record) {
      setForm({
        title: record.title,
        description: record.description || '',
        category: record.category,
        priority: record.priority,
        status: record.status,
        estimatedCost: record.estimatedCost?.toString() || '',
        actualCost: record.actualCost?.toString() || '',
        vendorName: record.vendorName || '',
        vendorPhone: record.vendorPhone || '',
        vendorEmail: record.vendorEmail || '',
        scheduledDate: record.scheduledDate
          ? new Date(record.scheduledDate).toISOString().split('T')[0]
          : '',
        notes: record.notes || '',
        recurring: record.recurring,
      });
    } else {
      setForm({
        title: '',
        description: '',
        category: 'OTHER',
        priority: 'MEDIUM',
        status: 'PENDING',
        estimatedCost: '',
        actualCost: '',
        vendorName: '',
        vendorPhone: '',
        vendorEmail: '',
        scheduledDate: '',
        notes: '',
        recurring: false,
      });
    }
  }, [record]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      estimatedCost: form.estimatedCost ? parseFloat(form.estimatedCost) : undefined,
      actualCost: form.actualCost ? parseFloat(form.actualCost) : undefined,
      scheduledDate: form.scheduledDate
        ? new Date(form.scheduledDate).toISOString()
        : undefined,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={record ? 'Edit Record' : 'New Maintenance Record'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          required
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />

        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
        />

        <div className="grid grid-cols-3 gap-4">
          <Select
            label="Category"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            options={CATEGORIES.map((c) => ({
              value: c,
              label: c.replace('_', ' '),
            }))}
          />
          <Select
            label="Priority"
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            options={PRIORITIES.map((p) => ({ value: p, label: p }))}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            options={STATUSES.map((s) => ({
              value: s,
              label: s.replace('_', ' '),
            }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Estimated Cost ($)"
            type="number"
            value={form.estimatedCost}
            onChange={(e) => setForm((f) => ({ ...f, estimatedCost: e.target.value }))}
          />
          <Input
            label="Actual Cost ($)"
            type="number"
            value={form.actualCost}
            onChange={(e) => setForm((f) => ({ ...f, actualCost: e.target.value }))}
          />
        </div>

        <Input
          label="Scheduled Date"
          type="date"
          value={form.scheduledDate}
          onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
        />

        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Vendor Information</h4>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Name"
              value={form.vendorName}
              onChange={(e) => setForm((f) => ({ ...f, vendorName: e.target.value }))}
            />
            <Input
              label="Phone"
              value={form.vendorPhone}
              onChange={(e) => setForm((f) => ({ ...f, vendorPhone: e.target.value }))}
            />
            <Input
              label="Email"
              type="email"
              value={form.vendorEmail}
              onChange={(e) => setForm((f) => ({ ...f, vendorEmail: e.target.value }))}
            />
          </div>
        </div>

        <Textarea
          label="Notes"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={2}
        />

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{record ? 'Update' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}
