"""Enregistre toutes les phrases du jeu avec une voix neuronale Piper.

Usage : python3 generer_voix.py textes.json modele.onnx dossier_de_sortie

textes.json associe un identifiant à chaque phrase. Le script produit un
fichier MP3 par phrase, tous ramenés au même niveau sonore.
"""
import io
import json
import subprocess
import sys
import wave

import numpy as np
from piper import PiperVoice


def enregistrer(voix, phrase):
    tampon = io.BytesIO()
    with wave.open(tampon, "wb") as sortie:
        voix.synthesize_wav(phrase, sortie)
    tampon.seek(0)
    with wave.open(tampon) as entree:
        cadence = entree.getframerate()
        son = np.frombuffer(entree.readframes(entree.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    return son, cadence


def nettoyer(son, cadence):
    # Retire le silence au début et à la fin, puis égalise le niveau.
    fort = np.where(np.abs(son) > 0.01)[0]
    if len(fort):
        debut = max(0, fort[0] - int(0.03 * cadence))
        fin = min(len(son), fort[-1] + int(0.12 * cadence))
        son = son[debut:fin]
    niveau = np.sqrt(np.mean(son ** 2)) or 1.0
    son = son * (0.11 / niveau)
    crete = np.max(np.abs(son))
    if crete > 0.89:
        son = son * (0.89 / crete)
    return son


def ecrire_mp3(son, cadence, chemin):
    brut = (np.clip(son, -1, 1) * 32767).astype(np.int16).tobytes()
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(cadence),
         "-ac", "1", "-i", "pipe:0", "-b:a", "56k", chemin],
        input=brut, check=True,
    )


def main():
    textes = json.load(open(sys.argv[1], encoding="utf-8"))
    modele = sys.argv[2]
    dossier = sys.argv[3].rstrip("/")
    voix = PiperVoice.load(modele, config_path=modele + ".json")
    total = 0.0
    for identifiant, phrase in textes.items():
        son, cadence = enregistrer(voix, phrase)
        son = nettoyer(son, cadence)
        ecrire_mp3(son, cadence, "%s/%s.mp3" % (dossier, identifiant))
        total += len(son) / cadence
    print("%d phrases, %.0f secondes au total" % (len(textes), total))


if __name__ == "__main__":
    main()
