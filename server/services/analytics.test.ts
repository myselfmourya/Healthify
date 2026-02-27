import assert from 'node:assert';
import { test, describe } from 'node:test';
import {
    calculateHealthCreditScore,
    calculateDiseaseRisks,
    calculateMentalHealthScore,
    calculateLifestyleScore,
    evaluateLabValues
} from './analytics';

describe('Analytics Engine Tests', () => {

    test('calculateHealthCreditScore - Optimal Profile', () => {
        const result = calculateHealthCreditScore({
            age: 30,
            bmi: 22,
            activityLevel: 'active',
            sleepHours: 8,
            bloodPressure: '115/75',
            smokingStatus: 'never',
            alcoholStatus: 'rarely'
        });

        assert.ok(result.score > 800, 'Score should be highly optimal');
        assert.strictEqual(result.trend, 'UP');
        assert.ok(result.weightBreakdown['Optimal BMI'] === 40, 'Should award BMI points');
        assert.ok(result.weightBreakdown['Active Lifestyle'] === 50, 'Should award activity points');
    });

    test('calculateHealthCreditScore - High Risk Profile', () => {
        const result = calculateHealthCreditScore({
            age: 50,
            bmi: 32,
            activityLevel: 'sedentary',
            sleepHours: 4,
            bloodPressure: '145/95',
            smokingStatus: 'yes, daily',
            alcoholStatus: 'heavy'
        });

        assert.ok(result.score < 600, 'Score should be low for high risk profile');
        assert.ok(result.weightBreakdown['Active Smoking'] === -100, 'Should penalize smoking heavily');
        assert.ok(result.weightBreakdown['Obese BMI'] === -60, 'Should penalize obesity');
    });

    test('calculateDiseaseRisks - CVD & T2D Checks', () => {
        const result = calculateDiseaseRisks({
            age: 45,
            gender: 'Male',
            bmi: 31,
            bloodPressure: '135/85',
            familyHistory: ['Heart Disease', 'Diabetes'],
            smokingStatus: 'yes'
        });

        assert.ok(result.cardiovascularPercentage > 15, 'CVD risk should be elevated');
        assert.ok(result.type2DiabetesPercentage > 15, 'T2D risk should be elevated');
        assert.strictEqual(result.status, 'WARNING');

        // Explainability breakdown checks
        assert.ok(result.cvdBreakdown['Smoking'] === 10, 'CVD breakdown implies smoking weight');
        assert.ok(result.t2dBreakdown['Family History'] === 10, 'T2D breakdown implies family history weight');
    });

    test('calculateMentalHealthScore - Neutral to Good', () => {
        const result = calculateMentalHealthScore([4, 5, 4], 8);
        assert.ok(result.mentalScore > 60, 'Good mood and sleep should yield high score');
        assert.strictEqual(result.riskBand, 'Low');
    });

    test('calculateLifestyleScore - Baseline Tests', () => {
        const result = calculateLifestyleScore({
            mealsPerDay: 2,
            waterIntake: 3,
            exerciseMinutes: 10,
            sugarIntake: 'high',
            vegIntake: 'low'
        });
        assert.ok(result.score < 50, 'Poor habits should drop the score significantly');
        assert.ok(result.recommendations.length >= 4, 'Multiple recommendations should trigger');
    });

    test('evaluateLabValues - Structured Reference Ranges', () => {
        const labs = evaluateLabValues([
            { testName: 'fasting blood sugar', value: 110, unit: 'mg/dL' },
            { testName: 'hdl cholesterol', value: 35, unit: 'mg/dL' }
        ]);

        assert.ok(labs[0].interpretation.includes('Prediabetes'), 'FBS 110 is Prediabetes range');
        assert.strictEqual(labs[0].isAnomalous, true);

        assert.ok(labs[1].interpretation.includes('Low'), 'HDL 35 is considered Low/Risk');
        assert.strictEqual(labs[1].isAnomalous, true);
    });
});
