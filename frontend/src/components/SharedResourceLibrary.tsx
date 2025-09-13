import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FolderOpen, 
  Upload, 
  Download, 
  Edit, 
  Trash2,
  Image,
  FileText,
  Music,
  Video,
  Archive,
  Eye,
  Tag,
  Filter,
  Search,
  X,
  Plus
} from 'lucide-react';
import { sharedResourceApi } from '@/services/api';

interface SharedResource {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  file_path: string;
  file_url: string;
  file_size: number;
  file_type: string;
  thumbnail_path?: string;
  thumbnail_url?: string;
  tags: string[];
  access_level: 'dm_only' | 'players' | 'public';
  download_count: number;
  is_public: boolean;
  created_at: string;
}

interface ResourceInfo {
  types: string[];
  categories: Record<string, string>;
  access_levels: string[];
  max_file_size: number;
  allowed_file_types: Record<string, string[]>;
}

interface SharedResourceLibraryProps {
  campaignId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const SharedResourceLibrary: React.FC<SharedResourceLibraryProps> = ({
  campaignId,
  isOpen,
  onClose,
}) => {
  const [resources, setResources] = useState<SharedResource[]>([]);
  const [resourceInfo, setResourceInfo] = useState<ResourceInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedResource, setSelectedResource] = useState<SharedResource | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    access_level: '',
    tag: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    type: 'image',
    category: 'other',
    access_level: 'players',
    tags: '',
    is_public: false,
    file: null as File | null,
  });

  useEffect(() => {
    if (isOpen && campaignId) {
      loadResources();
      loadResourceInfo();
    }
  }, [isOpen, campaignId]);

  useEffect(() => {
    if (isOpen) {
      loadResources();
    }
  }, [filters, searchQuery]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value)
      );
      const data = await sharedResourceApi.list(campaignId, activeFilters);
      
      // Filter by search query locally
      const filteredData = searchQuery
        ? data.filter(resource => 
            resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
          )
        : data;
      
      setResources(filteredData);
    } catch (error) {
      console.error('Failed to load resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadResourceInfo = async () => {
    try {
      const data = await sharedResourceApi.getResourceInfo();
      setResourceInfo(data);
    } catch (error) {
      console.error('Failed to load resource info:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm(prev => ({ 
        ...prev, 
        file,
        name: prev.name || file.name.split('.')[0]
      }));
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file) return;

    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('name', uploadForm.name);
      formData.append('description', uploadForm.description);
      formData.append('type', uploadForm.type);
      formData.append('category', uploadForm.category);
      formData.append('access_level', uploadForm.access_level);
      formData.append('tags', uploadForm.tags);
      formData.append('is_public', uploadForm.is_public.toString());

      await sharedResourceApi.upload(campaignId, formData);
      setShowUploadDialog(false);
      resetUploadForm();
      loadResources();
    } catch (error) {
      console.error('Failed to upload resource:', error);
    }
  };

  const handleDownload = async (resource: SharedResource) => {
    try {
      const blob = await sharedResourceApi.download(resource.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resource.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download resource:', error);
    }
  };

  const handleDelete = async (resourceId: string) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        await sharedResourceApi.delete(resourceId);
        loadResources();
      } catch (error) {
        console.error('Failed to delete resource:', error);
      }
    }
  };

  const resetUploadForm = () => {
    setUploadForm({
      name: '',
      description: '',
      type: 'image',
      category: 'other',
      access_level: 'players',
      tags: '',
      is_public: false,
      file: null,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      case 'audio': return <Music className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      default: return <Archive className="w-4 h-4" />;
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'dm_only': return 'bg-red-500';
      case 'players': return 'bg-blue-500';
      case 'public': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Shared Resource Library
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  {resourceInfo?.types.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.category}
                onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {Object.entries(resourceInfo?.categories || {}).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.access_level}
                onValueChange={(value) => setFilters(prev => ({ ...prev, access_level: value }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Access" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Access</SelectItem>
                  {resourceInfo?.access_levels.map(level => (
                    <SelectItem key={level} value={level}>
                      {level.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={() => setShowUploadDialog(true)} className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload
              </Button>
            </div>
          </div>

          {/* Clear Filters */}
          {(Object.values(filters).some(f => f) || searchQuery) && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchQuery}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                </Badge>
              )}
              {Object.entries(filters).map(([key, value]) => value && (
                <Badge key={key} variant="secondary" className="gap-1">
                  {key}: {value}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => setFilters(prev => ({ ...prev, [key]: '' }))} 
                  />
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilters({ type: '', category: '', access_level: '', tag: '' });
                  setSearchQuery('');
                }}
              >
                Clear All
              </Button>
            </div>
          )}

          {/* Resource Grid */}
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.map((resource) => (
                <Card key={resource.id} className="group hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {getFileIcon(resource.type)}
                        <CardTitle className="text-sm truncate">{resource.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(resource)}
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedResource(resource)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(resource.id)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {/* Thumbnail or File Type */}
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      {resource.thumbnail_url ? (
                        <img
                          src={resource.thumbnail_url}
                          alt={resource.name}
                          className="max-w-full max-h-full rounded-lg"
                        />
                      ) : (
                        <div className="text-6xl text-muted-foreground">
                          {getFileIcon(resource.type)}
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {resource.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {resource.description}
                      </p>
                    )}

                    {/* Tags */}
                    {resource.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {resource.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {resource.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{resource.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Badge className={getAccessLevelColor(resource.access_level)} variant="secondary">
                          {resource.access_level.replace('_', ' ')}
                        </Badge>
                        <span>{formatFileSize(resource.file_size)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {resource.download_count}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {resources.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No resources found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upload Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Resource</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">File</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="file"
                  onChange={handleFileSelect}
                  className="w-full p-2 border rounded-lg"
                />
                {resourceInfo && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Max file size: {formatFileSize(resourceInfo.max_file_size)}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Resource name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Resource description..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={uploadForm.type}
                    onValueChange={(value) => setUploadForm(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {resourceInfo?.types.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={uploadForm.category}
                    onValueChange={(value) => setUploadForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(resourceInfo?.categories || {}).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="access_level">Access Level</Label>
                <Select
                  value={uploadForm.access_level}
                  onValueChange={(value) => setUploadForm(prev => ({ ...prev, access_level: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {resourceInfo?.access_levels.map(level => (
                      <SelectItem key={level} value={level}>
                        {level.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="Enter tags separated by commas"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpload} disabled={!uploadForm.file}>
                  Upload
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Resource Detail Dialog */}
        {selectedResource && (
          <Dialog open={!!selectedResource} onOpenChange={() => setSelectedResource(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getFileIcon(selectedResource.type)}
                  {selectedResource.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Preview */}
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  {selectedResource.type === 'image' ? (
                    <img
                      src={selectedResource.file_url}
                      alt={selectedResource.name}
                      className="max-w-full max-h-full rounded-lg"
                    />
                  ) : (
                    <div className="text-8xl text-muted-foreground">
                      {getFileIcon(selectedResource.type)}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <div>{selectedResource.description || 'No description'}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Category</Label>
                    <div>{resourceInfo?.categories[selectedResource.category] || selectedResource.category}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">File Size</Label>
                    <div>{formatFileSize(selectedResource.file_size)}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Downloads</Label>
                    <div>{selectedResource.download_count}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Access Level</Label>
                    <Badge className={getAccessLevelColor(selectedResource.access_level)}>
                      {selectedResource.access_level.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Created</Label>
                    <div>{new Date(selectedResource.created_at).toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Tags */}
                {selectedResource.tags.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Tags</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedResource.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleDownload(selectedResource)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDelete(selectedResource.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};