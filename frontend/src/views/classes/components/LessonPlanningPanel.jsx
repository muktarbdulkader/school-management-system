import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import {
  Add,
  ExpandMore,
  ExpandLess,
  MenuBook,
  ListAlt,
  EventNote,
  Layers,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';

/* ─────────────────────────────────────────────────────────────── helpers */
const api = (path, token, method = 'GET', body = null) =>
  fetch(`${Backend.auth}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }).then((r) => r.json());

/* ─────────────────────────────────────────────── TabPanel helper */
const TabPanel = ({ children, value, index }) =>
  value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;

/* ═══════════════════════════════════════════════════════════════════════
   1.  CREATE UNIT FORM
   ═══════════════════════════════════════════════════════════════════════ */
const CreateUnitForm = ({ subjectId, onCreated }) => {
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ category_id: '', name: '' });

  const loadCategories = useCallback(async () => {
    setLoadingCats(true);
    try {
      const token = await GetToken();
      const res = await api(Backend.objectiveCategories, token);
      if (res.success || Array.isArray(res.data)) {
        const all = res.data || [];
        // Filter to categories belonging to this subject
        setCategories(all.filter((c) => c.subject_details?.id === subjectId || c.subject_id === subjectId));
      }
    } catch (e) {
      console.error('load categories error', e);
    } finally {
      setLoadingCats(false);
    }
  }, [subjectId]);

  useEffect(() => {
    if (open) loadCategories();
  }, [open, loadCategories]);

  const handleSave = async () => {
    if (!form.category_id || !form.name.trim()) {
      toast.error('Category and unit name are required');
      return;
    }
    setSaving(true);
    try {
      const token = await GetToken();
      const res = await api(Backend.objectiveUnits, token, 'POST', {
        category_id: form.category_id,
        name: form.name.trim(),
      });
      if (res.success) {
        toast.success('Unit created successfully!');
        setOpen(false);
        setForm({ category_id: '', name: '' });
        onCreated?.();
      } else {
        toast.error(res.message || 'Failed to create unit');
      }
    } catch (e) {
      toast.error('Error creating unit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<Add />}
        size="small"
        onClick={() => setOpen(true)}
        sx={{ textTransform: 'none' }}
      >
        New Unit
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Unit</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Units are curriculum topics (e.g., "Fractions", "Electricity") for this subject.
            </Alert>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Category *</InputLabel>
              <Select
                value={form.category_id}
                label="Category *"
                onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                disabled={loadingCats}
              >
                {loadingCats && <MenuItem disabled>Loading…</MenuItem>}
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
                {!loadingCats && categories.length === 0 && (
                  <MenuItem disabled>No categories for this subject</MenuItem>
                )}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Unit Name *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g., Fractions and Decimals"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
            Create Unit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   2.  CREATE SUBUNIT FORM
   ═══════════════════════════════════════════════════════════════════════ */
const CreateSubunitForm = ({ subjectId, onCreated }) => {
  const [units, setUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ unit_id: '', name: '' });

  const loadUnits = useCallback(async () => {
    setLoadingUnits(true);
    try {
      const token = await GetToken();
      const res = await api(Backend.objectiveUnits, token);
      if (res.success || Array.isArray(res.data)) {
        const all = res.data || [];
        // Filter units that belong to this subject via category
        setUnits(
          all.filter(
            (u) =>
              u.category_details?.subject_details?.id === subjectId ||
              u.category_details?.subject_id === subjectId
          )
        );
      }
    } catch (e) {
      console.error('load units error', e);
    } finally {
      setLoadingUnits(false);
    }
  }, [subjectId]);

  useEffect(() => {
    if (open) loadUnits();
  }, [open, loadUnits]);

  const handleSave = async () => {
    if (!form.unit_id || !form.name.trim()) {
      toast.error('Unit and subunit name are required');
      return;
    }
    setSaving(true);
    try {
      const token = await GetToken();
      const res = await api(Backend.objectiveSubunits, token, 'POST', {
        unit_id: form.unit_id,
        name: form.name.trim(),
      });
      if (res.success) {
        toast.success('Subunit created successfully!');
        setOpen(false);
        setForm({ unit_id: '', name: '' });
        onCreated?.();
      } else {
        toast.error(res.message || 'Failed to create subunit');
      }
    } catch (e) {
      toast.error('Error creating subunit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<Add />}
        size="small"
        onClick={() => setOpen(true)}
        sx={{ textTransform: 'none' }}
      >
        New Subunit
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Subunit</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Subunits break a unit into smaller topics (e.g., "Adding Fractions", "Simplification").
            </Alert>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Parent Unit *</InputLabel>
              <Select
                value={form.unit_id}
                label="Parent Unit *"
                onChange={(e) => setForm((f) => ({ ...f, unit_id: e.target.value }))}
                disabled={loadingUnits}
              >
                {loadingUnits && <MenuItem disabled>Loading…</MenuItem>}
                {units.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.name}
                  </MenuItem>
                ))}
                {!loadingUnits && units.length === 0 && (
                  <MenuItem disabled>No units found — create a unit first</MenuItem>
                )}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Subunit Name *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g., Adding Fractions with Same Denominator"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
            Create Subunit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   3.  CREATE LESSON PLAN FORM
   ═══════════════════════════════════════════════════════════════════════ */
const CreateLessonPlanForm = ({ classData, onCreated }) => {
  const subjectId = classData?.id;
  const classId   = classData?.class_id;

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [units, setUnits]       = useState([]);
  const [subunits, setSubunits] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [terms, setTerms]       = useState([]);

  const [loadingUnits, setLoadingUnits]     = useState(false);
  const [loadingSubs, setLoadingSubs]       = useState(false);
  const [loadingObjs, setLoadingObjs]       = useState(false);
  const [loadingTerms, setLoadingTerms]     = useState(false);

  const [form, setForm] = useState({
    unit_id: '',
    subunit_id: '',
    learning_objectives: '',
    term_id: '',
    lesson_aims: '',
    duration: '',
  });

  /* ---------- loaders ---------- */
  const loadUnits = useCallback(async () => {
    setLoadingUnits(true);
    try {
      const token = await GetToken();
      const res = await api(Backend.objectiveUnits, token);
      const all = res.data || [];
      setUnits(
        all.filter(
          (u) =>
            u.category_details?.subject_details?.id === subjectId ||
            u.category_details?.subject_id === subjectId
        )
      );
    } catch (e) { console.error(e); }
    finally { setLoadingUnits(false); }
  }, [subjectId]);

  const loadSubunits = useCallback(async (unitId) => {
    if (!unitId) { setSubunits([]); return; }
    setLoadingSubs(true);
    try {
      const token = await GetToken();
      const res = await api(Backend.objectiveSubunits, token);
      const all = res.data || [];
      setSubunits(all.filter((s) => s.unit_details?.id === unitId || s.unit_id === unitId));
    } catch (e) { console.error(e); }
    finally { setLoadingSubs(false); }
  }, []);

  const loadObjectives = useCallback(async (unitId) => {
    if (!unitId) { setObjectives([]); return; }
    setLoadingObjs(true);
    try {
      const token = await GetToken();
      const res = await api(Backend.learningObjectives, token);
      const all = res.data || [];
      setObjectives(all.filter((o) => o.unit_details?.id === unitId || o.unit_id === unitId));
    } catch (e) { console.error(e); }
    finally { setLoadingObjs(false); }
  }, []);

  const loadTerms = useCallback(async () => {
    setLoadingTerms(true);
    try {
      const token = await GetToken();
      const res = await api(Backend.terms, token);
      const all = res.data || [];
      setTerms(all);
      const current = all.find((t) => t.is_current);
      if (current) setForm((f) => ({ ...f, term_id: current.id }));
    } catch (e) { console.error(e); }
    finally { setLoadingTerms(false); }
  }, []);

  useEffect(() => {
    if (open) { loadUnits(); loadTerms(); }
  }, [open]);

  const handleUnitChange = (unitId) => {
    setForm((f) => ({ ...f, unit_id: unitId, subunit_id: '', learning_objectives: '' }));
    loadSubunits(unitId);
    loadObjectives(unitId);
  };

  const handleSave = async () => {
    if (!form.unit_id || !form.term_id || !form.lesson_aims.trim() || !form.learning_objectives) {
      toast.error('Unit, Term, Learning Objective and Lesson Aims are required');
      return;
    }
    setSaving(true);
    try {
      const token = await GetToken();
      const payload = {
        subject_id: subjectId,
        unit_id: form.unit_id,
        subunit_id: form.subunit_id || null,
        learning_objectives: form.learning_objectives,
        term_id: form.term_id,
        lesson_aims: form.lesson_aims.trim(),
        duration: form.duration ? parseInt(form.duration) : null,
        learner_group_id: classId,
      };
      const res = await api(Backend.lessonPlans, token, 'POST', payload);
      if (res.success) {
        toast.success('Lesson plan created successfully!');
        setOpen(false);
        setForm({ unit_id: '', subunit_id: '', learning_objectives: '', term_id: '', lesson_aims: '', duration: '' });
        onCreated?.();
      } else {
        const errMsg = typeof res.message === 'string' 
          ? res.message 
          : JSON.stringify(res.errors || res.message || 'Failed to create lesson plan');
        toast.error(errMsg);
      }
    } catch (e) {
      toast.error('Error creating lesson plan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<Add />}
        size="small"
        onClick={() => setOpen(true)}
        sx={{ textTransform: 'none' }}
      >
        New Lesson Plan
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Daily Lesson Plan</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              This lesson plan will be created for <strong>{classData?.name}</strong> — section{' '}
              <strong>{classData?.class_section || classData?.section_id}</strong>.
            </Alert>

            <Grid container spacing={2}>
              {/* Unit */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Unit *</InputLabel>
                  <Select
                    value={form.unit_id}
                    label="Unit *"
                    onChange={(e) => handleUnitChange(e.target.value)}
                    disabled={loadingUnits}
                  >
                    {loadingUnits && <MenuItem disabled>Loading…</MenuItem>}
                    {units.map((u) => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
                    {!loadingUnits && units.length === 0 && <MenuItem disabled>No units — create one first</MenuItem>}
                  </Select>
                </FormControl>
              </Grid>

              {/* Subunit */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Subunit (optional)</InputLabel>
                  <Select
                    value={form.subunit_id}
                    label="Subunit (optional)"
                    onChange={(e) => setForm((f) => ({ ...f, subunit_id: e.target.value }))}
                    disabled={loadingSubs || !form.unit_id}
                  >
                    <MenuItem value="">— None —</MenuItem>
                    {subunits.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>

              {/* Learning Objective */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Learning Objective *</InputLabel>
                  <Select
                    value={form.learning_objectives}
                    label="Learning Objective *"
                    onChange={(e) => setForm((f) => ({ ...f, learning_objectives: e.target.value }))}
                    disabled={loadingObjs || !form.unit_id}
                  >
                    {loadingObjs && <MenuItem disabled>Loading…</MenuItem>}
                    {objectives.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.framework_code} – {o.description?.substring(0, 60)}…
                      </MenuItem>
                    ))}
                    {!loadingObjs && objectives.length === 0 && form.unit_id && (
                      <MenuItem disabled>No objectives for this unit</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>

              {/* Term */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Term *</InputLabel>
                  <Select
                    value={form.term_id}
                    label="Term *"
                    onChange={(e) => setForm((f) => ({ ...f, term_id: e.target.value }))}
                    disabled={loadingTerms}
                  >
                    {loadingTerms && <MenuItem disabled>Loading…</MenuItem>}
                    {terms.map((t) => (
                      <MenuItem key={t.id} value={t.id}>
                        {t.name} {t.is_current ? '(Current)' : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Duration */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Duration (minutes)"
                  value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                  inputProps={{ min: 1 }}
                />
              </Grid>

              {/* Lesson Aims */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Lesson Aims *"
                  value={form.lesson_aims}
                  onChange={(e) => setForm((f) => ({ ...f, lesson_aims: e.target.value }))}
                  placeholder="Describe the goals and aims of this lesson…"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
            Create Lesson Plan
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   4.  UNITS & SUBUNITS LIST (read-only overview)
   ═══════════════════════════════════════════════════════════════════════ */
const UnitsOverview = ({ subjectId, refreshTrigger }) => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const res = await api(Backend.objectiveUnits, token);
      const all = res.data || [];
      setUnits(
        all.filter(
          (u) =>
            u.category_details?.subject_details?.id === subjectId ||
            u.category_details?.subject_id === subjectId
        )
      );
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [subjectId]);

  useEffect(() => { load(); }, [load, refreshTrigger]);

  const toggle = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  if (loading) return <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>;
  if (units.length === 0)
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Layers sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography color="text.secondary">No units yet — create your first unit above.</Typography>
      </Box>
    );

  return (
    <Box>
      {units.map((unit) => (
        <Card key={unit.id} variant="outlined" sx={{ mb: 1.5, borderRadius: 2 }}>
          <CardContent sx={{ py: '12px !important' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>{unit.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Category: {unit.category_details?.name || '—'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {unit.created_by_details && (
                  <Chip label="Custom" size="small" color="secondary" variant="outlined" />
                )}
                <IconButton size="small" onClick={() => toggle(unit.id)}>
                  {expanded[unit.id] ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>
            </Box>

            <Collapse in={!!expanded[unit.id]} timeout="auto">
              <SubunitsForUnit unitId={unit.id} />
            </Collapse>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

const SubunitsForUnit = ({ unitId }) => {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    GetToken().then((token) =>
      api(Backend.objectiveSubunits, token)
        .then((res) => {
          const all = res.data || [];
          setSubs(all.filter((s) => s.unit_details?.id === unitId || s.unit_id === unitId));
        })
        .finally(() => setLoading(false))
    );
  }, [unitId]);

  if (loading) return <CircularProgress size={16} sx={{ ml: 2, mt: 1 }} />;
  if (subs.length === 0)
    return <Typography variant="caption" color="text.secondary" sx={{ ml: 1, display: 'block', mt: 1 }}>No subunits.</Typography>;

  return (
    <Box sx={{ mt: 1, pl: 2, borderLeft: '3px solid', borderColor: 'primary.light' }}>
      {subs.map((s) => (
        <Box key={s.id} sx={{ py: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ListAlt sx={{ fontSize: 14, color: 'text.secondary' }} />
          <Typography variant="body2">{s.name}</Typography>
          {s.created_by_details && <Chip label="Custom" size="small" color="info" variant="outlined" sx={{ height: 16, fontSize: 10 }} />}
        </Box>
      ))}
    </Box>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   5.  LESSON PLANS LIST
   ═══════════════════════════════════════════════════════════════════════ */
const LessonPlansList = ({ refreshTrigger }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const res = await api(Backend.lessonPlans, token);
      setPlans(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load, refreshTrigger]);

  if (loading) return <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>;
  if (plans.length === 0)
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <EventNote sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography color="text.secondary">No lesson plans yet — create your first plan above.</Typography>
      </Box>
    );

  return (
    <Box>
      {plans.map((p) => (
        <Card key={p.id} variant="outlined" sx={{ mb: 1.5, borderRadius: 2 }}>
          <CardContent sx={{ py: '12px !important' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {p.unit_details?.name || 'Lesson Plan'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {p.subject_details?.name} • Term: {p.term_details?.name} 
                  {p.duration ? ` • ${p.duration} min` : ''}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {p.lesson_aims?.substring(0, 120)}{p.lesson_aims?.length > 120 ? '…' : ''}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                {p.subunit_details && (
                  <Chip label={p.subunit_details.name} size="small" variant="outlined" color="primary" />
                )}
                <Typography variant="caption" color="text.secondary">
                  {new Date(p.created_at).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   MAIN EXPORT: LessonPlanningPanel
   ═══════════════════════════════════════════════════════════════════════ */
const LessonPlanningPanel = ({ classData }) => {
  const [tab, setTab] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const bump = () => setRefresh((r) => r + 1);

  const subjectId = classData?.id;

  if (!subjectId) return null;

  return (
    <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <CardContent sx={{ pb: '16px !important' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MenuBook color="primary" />
            <Typography variant="h6" fontWeight={700}>
              Lesson Planning
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {tab === 0 && <CreateUnitForm subjectId={subjectId} onCreated={bump} />}
            {tab === 1 && <CreateSubunitForm subjectId={subjectId} onCreated={bump} />}
            {tab === 2 && <CreateLessonPlanForm classData={classData} onCreated={bump} />}
          </Box>
        </Box>

        <Divider sx={{ mb: 1 }} />

        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          sx={{ mb: 1 }}
        >
          <Tab icon={<Layers fontSize="small" />} iconPosition="start" label="Units" sx={{ textTransform: 'none' }} />
          <Tab icon={<ListAlt fontSize="small" />} iconPosition="start" label="Subunits" sx={{ textTransform: 'none' }} />
          <Tab icon={<EventNote fontSize="small" />} iconPosition="start" label="Lesson Plans" sx={{ textTransform: 'none' }} />
        </Tabs>

        <TabPanel value={tab} index={0}>
          <UnitsOverview subjectId={subjectId} refreshTrigger={refresh} />
        </TabPanel>
        <TabPanel value={tab} index={1}>
          <UnitsOverview subjectId={subjectId} refreshTrigger={refresh} />
        </TabPanel>
        <TabPanel value={tab} index={2}>
          <LessonPlansList refreshTrigger={refresh} />
        </TabPanel>
      </CardContent>
    </Card>
  );
};

export default LessonPlanningPanel;
