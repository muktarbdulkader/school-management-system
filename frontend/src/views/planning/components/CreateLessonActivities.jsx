import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { toast } from "react-toastify";
import Backend from "services/backend";
import GetToken from "utils/auth-token";

const MIN_FIELD_LEN = 10;
const MIN_ACTIVITY_LEN = 3;

const initialForm = {
  learning_statement: "",
  activity_sheet: "",
  topic_content: "",
  learner_activities: {
    group1: [""],
    group2: [""],
    group3: [""],
  },
  success_criteria: "",
  extra_challenges: "",
  accomodation: "",
  formative_assessment: "",
  materials: "",
};

const initialErrors = {
  learning_statement: "",
  success_criteria: "",
  learner_activities: "", // group-level summary error
  lessonPlanId: "",
  submit: "",
};

const FeedbackPopup = ({ open, onClose, lessonPlanId, onSuccess }) => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState(initialErrors);
  const [submitting, setSubmitting] = useState(false);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setErrors(initialErrors);
      setSubmitting(false);
    }
  }, [open]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleGroupChange = (group, idx, value) => {
    setForm((prev) => {
      const updated = [...prev.learner_activities[group]];
      updated[idx] = value;
      return {
        ...prev,
        learner_activities: { ...prev.learner_activities, [group]: updated },
      };
    });
    setErrors((prev) => ({ ...prev, learner_activities: "" }));
  };

  const addActivity = (group) => {
    setForm((prev) => ({
      ...prev,
      learner_activities: {
        ...prev.learner_activities,
        [group]: [...prev.learner_activities[group], ""],
      },
    }));
  };

  const removeActivity = (group, idx) => {
    setForm((prev) => {
      const updated = [...prev.learner_activities[group]];
      if (updated.length === 1) {
        // keep at least one field per group
        updated[0] = "";
      } else {
        updated.splice(idx, 1);
      }
      return {
        ...prev,
        learner_activities: { ...prev.learner_activities, [group]: updated },
      };
    });
  };

  const validateField = (field, value) => {
    switch (field) {
      case "learning_statement":
        if (!value || value.trim().length < MIN_FIELD_LEN) {
          return `Learning statement required (min ${MIN_FIELD_LEN} characters).`;
        }
        return "";
      case "success_criteria":
        if (!value || value.trim().length < MIN_FIELD_LEN) {
          return `Success criteria required (min ${MIN_FIELD_LEN} characters).`;
        }
        return "";
      default:
        return "";
    }
  };

  const validateActivities = (activitiesObj) => {
    const allActivities = [
      ...activitiesObj.group1,
      ...activitiesObj.group2,
      ...activitiesObj.group3,
    ].map((a) => (a ?? "").trim());

    const anyFilled = allActivities.some((a) => a.length > 0);
    if (!anyFilled) {
      return "At least one activity required across groups.";
    }

    for (const a of allActivities) {
      if (a.length > 0 && a.length < MIN_ACTIVITY_LEN) {
        return `Each filled activity must be at least ${MIN_ACTIVITY_LEN} characters.`;
      }
    }
    return "";
  };

  const validateForm = () => {
    const newErrors = { ...initialErrors };

    if (!lessonPlanId) {
      newErrors.lessonPlanId = "Missing lesson plan id — select a plan.";
    }

    newErrors.learning_statement = validateField(
      "learning_statement",
      form.learning_statement,
    );
    newErrors.success_criteria = validateField(
      "success_criteria",
      form.success_criteria,
    );

    newErrors.learner_activities = validateActivities(form.learner_activities);

    setErrors(newErrors);
    return !(
      newErrors.lessonPlanId ||
      newErrors.learning_statement ||
      newErrors.success_criteria ||
      newErrors.learner_activities
    );
  };

  const handleBlur = (field) => {
    const err = validateField(field, form[field]);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix validation errors before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const token = await GetToken();
      const API = `${Backend.api}${Backend.getMyLessonActivities}`;
      console.log("Submitting to API:", API, { lessonPlanId, ...form });
      const payload = {
        lesson_plan_id: lessonPlanId,
        ...form,
      };
      console.log("Submitting payload:", payload);
      const res = await fetch(`${API}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      console.log("Submit response:", res.body);
      if (res.ok) {
        toast.success("Feedback submitted!");
        onSuccess?.();
        onClose();
      } else {
        const errorData = await res.json().catch(() => null);
        const msg =
          (errorData && (errorData.message || errorData.error)) ||
          "Failed to submit feedback";
        setErrors((prev) => ({ ...prev, submit: msg }));
        toast.error(msg);
      }
    } catch (err) {
      console.error(err);
      setErrors((prev) => ({ ...prev, submit: "Server error" }));
      toast.error("Server error");
    } finally {
      setSubmitting(false);
    }
  };

  // top-level error summary
  const hasTopErrors =
    Boolean(errors.lessonPlanId) ||
    Boolean(errors.learning_statement) ||
    Boolean(errors.success_criteria) ||
    Boolean(errors.learner_activities) ||
    Boolean(errors.submit);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 700, fontSize: "1.5rem", color: "primary.main" }}>
        ✨ Lesson Feedback & Activities
      </DialogTitle>

      <DialogContent dividers>
        {hasTopErrors && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="error" sx={{ mb: 1 }}>
              Please fix the errors below before submitting.
            </Alert>
            {errors.lessonPlanId && (
              <Typography color="error" variant="body2">
                {errors.lessonPlanId}
              </Typography>
            )}
            {errors.submit && (
              <Typography color="error" variant="body2">
                {errors.submit}
              </Typography>
            )}
          </Box>
        )}

        <Grid container spacing={3}>
          {/* Left column */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="h6" gutterBottom>
                General Info
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <TextField
                label="Learning Statement"
                value={form.learning_statement}
                onChange={(e) => handleChange("learning_statement", e.target.value)}
                onBlur={() => handleBlur("learning_statement")}
                fullWidth
                multiline
                rows={2}
                sx={{ mb: 2 }}
                error={Boolean(errors.learning_statement)}
                helperText={errors.learning_statement || ""}
              />
              <TextField
                label="Activity Sheet"
                value={form.activity_sheet}
                onChange={(e) => handleChange("activity_sheet", e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Topic Content"
                value={form.topic_content}
                onChange={(e) => handleChange("topic_content", e.target.value)}
                fullWidth
                multiline
                rows={2}
              />
            </Paper>
          </Grid>

          {/* Right column */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="h6" gutterBottom>
                Assessment & Support
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <TextField
                label="Success Criteria"
                value={form.success_criteria}
                onChange={(e) => handleChange("success_criteria", e.target.value)}
                onBlur={() => handleBlur("success_criteria")}
                fullWidth
                multiline
                rows={3}
                sx={{ mb: 2 }}
                error={Boolean(errors.success_criteria)}
                helperText={errors.success_criteria || ""}
              />
              <TextField
                label="Extra Challenges"
                value={form.extra_challenges}
                onChange={(e) => handleChange("extra_challenges", e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Accomodation"
                value={form.accomodation}
                onChange={(e) => handleChange("accomodation", e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Formative Assessment"
                value={form.formative_assessment}
                onChange={(e) => handleChange("formative_assessment", e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Materials"
                value={form.materials}
                onChange={(e) => handleChange("materials", e.target.value)}
                fullWidth
              />
            </Paper>
          </Grid>

          {/* Learner Activities - full width */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 2, borderRadius: 3, bgcolor: 'grey.50' }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span role="img" aria-label="groups">👥</span> Learner Activities
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Add activities per group — minimum {MIN_ACTIVITY_LEN} characters each
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {errors.learner_activities && (
                <Typography color="error" variant="body2" sx={{ mb: 1 }}>
                  {errors.learner_activities}
                </Typography>
              )}

              <Grid container spacing={2}>
                {[
                  { key: "group1", label: "Group 1", color: "primary", bg: "#e3f2fd" },
                  { key: "group2", label: "Group 2", color: "success", bg: "#e8f5e9" },
                  { key: "group3", label: "Group 3", color: "warning", bg: "#fff3e0" },
                ].map(({ key: group, label, color, bg }, gIdx) => (
                  <Grid item xs={12} md={4} key={group}>
                    <Box sx={{ mb: 2, p: 2, bgcolor: bg, borderRadius: 2, border: `1px solid`, borderColor: `${color}.light` }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: `${color}.dark` }}>
                          {label}
                        </Typography>
                        <Tooltip title="Add activity">
                          <IconButton size="small" color={color} onClick={() => addActivity(group)}>
                            <AddCircleOutlineIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {form.learner_activities[group].map((act, idx) => {
                          const trimmed = (act ?? "").trim();
                          const actError =
                            trimmed.length > 0 && trimmed.length < MIN_ACTIVITY_LEN
                              ? `Min ${MIN_ACTIVITY_LEN} chars`
                              : "";

                          return (
                            <Box key={`${group}-${idx}`} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                              <TextField
                                value={act}
                                placeholder={`Activity ${idx + 1}`}
                                onChange={(e) => handleGroupChange(group, idx, e.target.value)}
                                fullWidth
                                size="small"
                                error={Boolean(actError)}
                                helperText={actError || ""}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    bgcolor: 'white',
                                    borderRadius: 1.5
                                  }
                                }}
                              />
                              <Tooltip title={form.learner_activities[group].length > 1 ? "Remove" : "Clear"}>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => removeActivity(group, idx)}
                                  sx={{ mt: "4px" }}
                                >
                                  <RemoveCircleOutlineIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
          sx={{
            bgcolor: "primary.main",
            "&:hover": { bgcolor: "primary.dark" },
            borderRadius: 2,
            px: 3,
          }}
        >
          {submitting ? "Submitting..." : "Submit Feedback"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FeedbackPopup;
