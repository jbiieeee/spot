import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import axios from 'axios';

admin.initializeApp();

export const verifyFaceMatch = onCall(async (request) => {
  const { candidateDataUrl, referenceDataUrl } = request.data || {};

  if (!candidateDataUrl || !referenceDataUrl) {
    throw new HttpsError('invalid-argument', 'Both candidate and reference images are required.');
  }

  const endpoint = process.env.AZURE_FACE_ENDPOINT;
  const key = process.env.AZURE_FACE_KEY;

  if (!endpoint || !key) {
    throw new HttpsError(
      'failed-precondition',
      'Azure Face API is not configured. Set AZURE_FACE_ENDPOINT and AZURE_FACE_KEY in Firebase Functions environment.'
    );
  }

  try {
    const detect1 = await axios.post(
      `${endpoint.replace(/\/$/, '')}/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=false`,
      { url: candidateDataUrl },
      {
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Content-Type': 'application/json'
        }
      }
    );

    const detect2 = await axios.post(
      `${endpoint.replace(/\/$/, '')}/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=false`,
      { url: referenceDataUrl },
      {
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Content-Type': 'application/json'
        }
      }
    );

    const face1 = detect1.data?.[0];
    const face2 = detect2.data?.[0];

    if (!face1 || !face2) {
      return { success: false, score: 0, reason: 'No faces detected in one of the inputs.' };
    }

    const verify = await axios.post(
      `${endpoint.replace(/\/$/, '')}/face/v1.0/verify`,
      {
        faceId1: face1.faceId,
        faceId2: face2.faceId
      },
      {
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Content-Type': 'application/json'
        }
      }
    );

    const score = Number(verify.data?.confidence || 0);
    const success = Boolean(verify.data?.isIdentical) && score >= 0.5;

    return {
      success,
      score,
      reason: success ? 'Face matched' : 'Face does not match',
      source: 'azure-face-api'
    };
  } catch (error) {
    const message = error?.response?.data?.error?.message || error.message || 'Face verification failed';
    throw new HttpsError('internal', message);
  }
});
