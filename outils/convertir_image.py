"""Convertit une image noir et blanc en illustration monochrome pour le jeu.

Usage : python3 convertir_image.py source.png destination.png [largeur] [seuil]

Le résultat est un PNG où le dessin est opaque et le fond transparent :
le jeu lui applique ensuite la couleur choisie par le joueur.
"""
import sys
from PIL import Image, ImageOps


def convertir(source, destination, largeur=100, seuil=70):
    image = Image.open(source).convert("L")
    hauteur = round(image.height * largeur / image.width)
    image = image.resize((largeur, hauteur), Image.BOX)
    image = ImageOps.autocontrast(image)
    encre = image.point(lambda v: 255 if v >= seuil else 0)
    resultat = Image.new("LA", image.size, (255, 0))
    resultat.putalpha(encre)
    resultat.save(destination, optimize=True)


if __name__ == "__main__":
    arguments = sys.argv[1:]
    convertir(
        arguments[0],
        arguments[1],
        int(arguments[2]) if len(arguments) > 2 else 100,
        int(arguments[3]) if len(arguments) > 3 else 70,
    )
