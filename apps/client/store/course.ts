import { defineStore } from "pinia";
import { computed, ref, watchEffect } from "vue";

import type { CoursePack } from "./coursePack";
import { fetchCompleteCourse, fetchCourse } from "~/api/course";
import { useActiveCourseMap } from "~/composables/courses/activeCourse";
import { isAuthenticated } from "~/services/auth";
import { useStatement } from "./statement";

export interface Statement {
  id: string;
  order: number;
  chinese: string;
  english: string;
  soundmark: string;
}

export interface CourseIdentifier {
  coursePackId: CoursePack["id"];
  courseId: Course["id"];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  order: number;
  statements: Statement[];
  coursePackId: CoursePack["id"];
  completionCount: number;
  statementIndex: number;
  video: string;
}

export const useCourseStore = defineStore("course", () => {
  const currentCourse = ref<Course>();
  const currentStatement = ref<Statement>();
  const { statementIndex, setupAutoSaveProgress } = useStatement();

  const { updateActiveCourseMap } = useActiveCourseMap();

  watchEffect(() => {
    currentStatement.value = currentCourse.value?.statements[statementIndex.value];
  });

  const words = computed(() => {
    return currentStatement.value?.english.split(" ") || [];
  });

  const totalQuestionsCount = computed(() => {
    return currentCourse.value?.statements.length || 0;
  });

  function toSpecificStatement(index: number) {
    statementIndex.value = index;
  }

  function toPreviousStatement() {
    statementIndex.value = Math.max(0, statementIndex.value - 1);
  }

  function toNextStatement() {
    statementIndex.value = Math.min(statementIndex.value + 1, totalQuestionsCount.value - 1);
  }

  function resetStatementIndex() {
    statementIndex.value = 0;
  }

  function isAllDone() {
    return statementIndex.value >= totalQuestionsCount.value - 1;
  }

  function doAgain() {
    resetStatementIndex();
    updateActiveCourseMap(currentCourse.value?.coursePackId!, currentCourse.value?.id!);
  }

  async function completeCourse() {
    const coursePackId = currentCourse.value?.coursePackId!;
    const res = await fetchCompleteCourse(coursePackId, currentCourse.value?.id!);
    return res;
  }

  async function setup(coursePackId: string, courseId: string) {
    let course = await fetchCourse(coursePackId, courseId);
    currentCourse.value = course;
    isAuthenticated() && setupAutoSaveProgress(currentCourse);
  }

  return {
    statementIndex,
    currentCourse,
    currentStatement,
    words,
    totalQuestionsCount,
    setup,
    doAgain,
    isAllDone,
    completeCourse,
    toSpecificStatement,
    toPreviousStatement,
    toNextStatement,
    resetStatementIndex,
  };
});
