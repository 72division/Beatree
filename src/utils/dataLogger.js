// 실험 데이터 수집 및 관리

const STORAGE_KEY = 'beatree_experiment_data';

class DataLogger {
  constructor() {
    this.currentSession = null;
    this.sessionStartTime = null;
  }

  // 새 실험 세션 시작
  startSession(startingTrack, userId = null) {
    this.sessionStartTime = Date.now();
    this.currentSession = {
      session_id: `${new Date().toISOString().slice(0, 10)}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      user_id: userId,
      starting_track: {
        id: startingTrack.id,
        name: startingTrack.name,
        artist: startingTrack.artists?.[0]?.name || 'Unknown',
        album: startingTrack.album?.name || 'Unknown',
        audio_features: null
      },
      branches: [],
      session_duration: null,
      total_satisfaction: null,
      liked_songs_ratio: 0.5,
      dev_mode_enabled: false,
      notes: ''
    };

    console.log('Started new experiment session:', this.currentSession.session_id);
    return this.currentSession;
  }

  // Audio Features 정보 추가
  setStartingTrackFeatures(audioFeatures) {
    if (this.currentSession) {
      this.currentSession.starting_track.audio_features = audioFeatures;
    }
  }

  // 분기 선택 기록
  logBranchSelection(branchData) {
    if (!this.currentSession) {
      console.error('No active session for logging branch');
      return;
    }

    const branch = {
      branch_number: this.currentSession.branches.length + 1,
      timestamp: new Date().toISOString(),
      button_text: `${branchData.pattern.emoji} ${branchData.pattern.label}`,
      pattern_key: branchData.patternKey,
      feature_changes: branchData.featureChanges,
      recommended_tracks: branchData.recommendedTracks.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists?.[0]?.name || 'Unknown',
        preview_url: track.preview_url,
        satisfaction_score: null,
        listened: false,
        selected: false
      })),
      selected_track: null,
      user_notes: ''
    };

    this.currentSession.branches.push(branch);
    this.saveToStorage();
    
    console.log('Logged branch selection:', branch);
    return branch;
  }

  // 트랙 미리듣기 기록
  logTrackListened(branchIndex, trackId) {
    if (!this.currentSession || !this.currentSession.branches[branchIndex]) {
      return;
    }

    const track = this.currentSession.branches[branchIndex].recommended_tracks
      .find(t => t.id === trackId);
    
    if (track) {
      track.listened = true;
      this.saveToStorage();
    }
  }

  // 트랙 선택 기록
  logTrackSelected(branchIndex, trackId, satisfactionScore = null) {
    if (!this.currentSession || !this.currentSession.branches[branchIndex]) {
      return;
    }

    const branch = this.currentSession.branches[branchIndex];
    const track = branch.recommended_tracks.find(t => t.id === trackId);
    
    if (track) {
      track.selected = true;
      track.satisfaction_score = satisfactionScore;
      branch.selected_track = trackId;
      this.saveToStorage();
    }
  }

  // 만족도 평가 기록
  logSatisfactionScore(branchIndex, trackId, score) {
    if (!this.currentSession || !this.currentSession.branches[branchIndex]) {
      return;
    }

    const track = this.currentSession.branches[branchIndex].recommended_tracks
      .find(t => t.id === trackId);
    
    if (track) {
      track.satisfaction_score = score;
      this.saveToStorage();
    }
  }

  // 좋아요 비율 설정 기록
  setLikedSongsRatio(ratio) {
    if (this.currentSession) {
      this.currentSession.liked_songs_ratio = ratio;
      this.saveToStorage();
    }
  }

  // 개발자 모드 설정 기록
  setDevModeEnabled(enabled) {
    if (this.currentSession) {
      this.currentSession.dev_mode_enabled = enabled;
      this.saveToStorage();
    }
  }

  // 사용자 메모 추가
  addUserNote(note, branchIndex = null) {
    if (!this.currentSession) {
      return;
    }

    if (branchIndex !== null && this.currentSession.branches[branchIndex]) {
      this.currentSession.branches[branchIndex].user_notes = note;
    } else {
      this.currentSession.notes = note;
    }
    
    this.saveToStorage();
  }

  // 세션 종료
  endSession(totalSatisfaction = null) {
    if (!this.currentSession) {
      return null;
    }

    const sessionDuration = Date.now() - this.sessionStartTime;
    this.currentSession.session_duration = this.formatDuration(sessionDuration);
    this.currentSession.total_satisfaction = totalSatisfaction;

    // 최종 저장
    this.saveToStorage();
    
    const completedSession = { ...this.currentSession };
    console.log('Session completed:', completedSession);

    // 세션 초기화
    this.currentSession = null;
    this.sessionStartTime = null;

    return completedSession;
  }

  // 로컬 스토리지에 저장
  saveToStorage() {
    try {
      const existingData = this.getAllSessions();
      
      // 현재 세션이 이미 존재하는지 확인
      const sessionIndex = existingData.findIndex(
        session => session.session_id === this.currentSession?.session_id
      );

      if (sessionIndex >= 0) {
        existingData[sessionIndex] = this.currentSession;
      } else if (this.currentSession) {
        existingData.push(this.currentSession);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: '1.0',
        last_updated: new Date().toISOString(),
        experiment_sessions: existingData
      }));

    } catch (error) {
      console.error('Failed to save session data:', error);
    }
  }

  // 모든 세션 데이터 가져오기
  getAllSessions() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.experiment_sessions || [];
      }
    } catch (error) {
      console.error('Failed to load session data:', error);
    }
    return [];
  }

  // 현재 세션 정보 반환
  getCurrentSession() {
    return this.currentSession;
  }

  // CSV 형태로 데이터 변환
  exportToCSV() {
    const sessions = this.getAllSessions();
    
    if (sessions.length === 0) {
      return null;
    }

    // CSV 헤더
    const headers = [
      'session_id',
      'timestamp',
      'user_id',
      'starting_track_name',
      'starting_track_artist',
      'branch_number',
      'button_text',
      'pattern_key',
      'recommended_track_name',
      'recommended_track_artist',
      'satisfaction_score',
      'listened',
      'selected',
      'liked_songs_ratio',
      'session_duration',
      'total_satisfaction'
    ];

    // CSV 데이터 생성
    const rows = [];
    
    sessions.forEach(session => {
      if (session.branches.length === 0) {
        // 분기가 없는 경우 기본 정보만
        rows.push([
          session.session_id,
          session.timestamp,
          session.user_id || '',
          session.starting_track.name,
          session.starting_track.artist,
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          session.liked_songs_ratio,
          session.session_duration || '',
          session.total_satisfaction || ''
        ]);
      } else {
        // 각 분기별로 행 생성
        session.branches.forEach(branch => {
          branch.recommended_tracks.forEach(track => {
            rows.push([
              session.session_id,
              session.timestamp,
              session.user_id || '',
              session.starting_track.name,
              session.starting_track.artist,
              branch.branch_number,
              branch.button_text,
              branch.pattern_key,
              track.name,
              track.artist,
              track.satisfaction_score || '',
              track.listened,
              track.selected,
              session.liked_songs_ratio,
              session.session_duration || '',
              session.total_satisfaction || ''
            ]);
          });
        });
      }
    });

    // CSV 문자열 생성
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    return {
      content: csvContent,
      filename: `beatree_experiment_data_${new Date().toISOString().slice(0, 10)}.csv`
    };
  }

  // 세션 지속 시간 포맷팅
  formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }

  // 데이터 삭제
  clearAllData() {
    localStorage.removeItem(STORAGE_KEY);
    this.currentSession = null;
    this.sessionStartTime = null;
  }
}

// 싱글톤 인스턴스
const dataLogger = new DataLogger();

export default dataLogger;