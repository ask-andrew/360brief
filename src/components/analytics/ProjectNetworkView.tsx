"use client";

import React, { useState } from 'react';
import { Card, Select, Empty, Typography } from 'antd';
import { mockNetworkData, getProjectNetworkData, NetworkData, Project, NetworkNode } from './charts/mockNetworkData';
import NetworkGraph from './charts/NetworkGraph';

type NetworkViewMode = 'people' | 'projects';

const { Option } = Select;
const { Title } = Typography;

const ProjectNetworkView: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<NetworkViewMode>('projects');

  // Get data based on current view mode and selected project
  const getNetworkData = (): NetworkData => {
    if (viewMode === 'people') {
      return mockNetworkData;
    }
    return getProjectNetworkData(selectedProject || undefined);
  };

  const networkData = getNetworkData();

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div>
          <span style={{ marginRight: 8 }}>View:</span>
          <Select
            value={viewMode}
            onChange={(value) => {
              setViewMode(value);
              if (value === 'people') setSelectedProject(null);
            }}
            style={{ width: 150 }}
          >
            <Option value="people">People Network</Option>
            <Option value="projects">Project Network</Option>
          </Select>
        </div>

        {viewMode === 'projects' && (
          <div>
            <span style={{ marginRight: 8 }}>Project:</span>
            <Select
              value={selectedProject || 'all'}
              onChange={(value) => setSelectedProject(value === 'all' ? null : value)}
              style={{ width: 200 }}
              placeholder="Select a project"
            >
              <Option value="all">All Projects</Option>
              {mockNetworkData.projects?.map((project: Project) => (
                <Option key={project.id} value={project.id}>
                  {project.name} ({project.participants.length} people)
                </Option>
              ))}
            </Select>
          </div>
        )}
      </div>

      <Card>
        {networkData.nodes?.length ? (
          <NetworkGraph
            data={networkData}
            viewMode={viewMode}
            selectedProjectId={selectedProject}
            onProjectSelect={(projectId) => {
              if (projectId) {
                setViewMode('projects');
                setSelectedProject(projectId === 'all' ? null : projectId);
              } else {
                setViewMode('people');
                setSelectedProject(null);
              }
            }}
          />
        ) : (
          <Empty 
            description={
              <Typography.Text type="secondary">
                No project data available. Connect more channels to see project networks.
              </Typography.Text>
            }
          />
        )}
      </Card>

      {viewMode === 'projects' && selectedProject && (
        <div style={{ marginTop: 24 }}>
          <Title level={5}>Project Details</Title>
          <Card>
            {mockNetworkData.projects
              ?.filter((p: Project) => p.id === selectedProject)
              .map((project: Project) => (
                <div key={project.id}>
                  <h3>{project.name}</h3>
                  <p>Participants: {project.participants.length}</p>
                  <p>Total Messages: {project.messageCount}</p>
                  <div>
                    <h4>Team Members:</h4>
                    <ul>
                      {project.participants.map((userId: string) => {
                        const user = mockNetworkData.nodes?.find((n: NetworkNode) => n.id === userId);
                        return user ? (
                          <li key={user.id}>
                            {user.name} ({user.email})
                            {user.is_external && ' (External)'}
                          </li>
                        ) : null;
                      })}
                    </ul>
                  </div>
                </div>
              ))}
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProjectNetworkView;
